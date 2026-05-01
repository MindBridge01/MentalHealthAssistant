// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { generateToken, verifyToken } = require('../lib/jwt'); // JWT helper
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requirePermission, normalizeRole } = require('../middleware/permissionMiddleware');
const { authRateLimiter } = require('../middleware/rateLimitMiddleware');
const axios = require('axios');
const {
  findUserByEmail,
  findUserByEmailOrFacebookId,
  createUser,
  updateUser,
  findUserById,
} = require('../models/userModel');
const { findProfileByUserId } = require('../models/profileModel');
const { createObjectId } = require('../lib/objectId');

// Google Auth
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const isProduction = process.env.NODE_ENV === 'production';
const ROLE_PATIENT = 'patient';
const ROLE_PENDING_DOCTOR = 'pending-doctor';
const ROLE_ADMIN = 'admin';

function normalizeStoredRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === ROLE_PATIENT || normalized === ROLE_PENDING_DOCTOR || normalized === 'doctor' || normalized === ROLE_ADMIN) {
    return normalized;
  }
  return ROLE_PATIENT;
}

async function normalizeUserRoleInDb(db, user) {
  const normalizedRole = normalizeStoredRole(user.role);
  if (normalizedRole !== user.role) {
    await updateUser(user._id, { role: normalizedRole, updatedAt: new Date() });
    user.role = normalizedRole;
  }
  return user;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 1000,
  };
}

// ------------------- Google Login -------------------
router.post('/google-login', authRateLimiter, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Missing Google ID token' });
  }

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    // Check if user exists
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({
        _id: createObjectId(),
        email,
        name,
        googleId,
        profilePic: picture || null,
        role: ROLE_PATIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      const profilePic = picture || user.profilePic || null;
      user = await updateUser(user._id, {
        googleId: googleId || user.googleId,
        profilePic,
        name: name || user.name,
        updatedAt: new Date(),
      });
    }

    user = await normalizeUserRoleInDb(null, user);

    // Fetch extended profile data if it exists in the new separate entity
    const profileData = await findProfileByUserId(user._id);

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());
    await req.logAuditEvent?.({
      action: 'user_login',
      resourceType: 'auth',
      resourceId: user._id,
      metadata: {
        authProvider: 'google',
        outcome: 'success',
      },
    });

    if (profileData) {
      delete profileData._id;
    }

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      token,
      ...(profileData || {}), // Merge separated profile data smoothly
    });

  } catch {
    console.error('[auth] google-login failed');
    await req.logAuditEvent?.({
      action: 'user_login_failed',
      resourceType: 'auth',
      resourceId: req.body?.email || 'google-login',
      metadata: {
        authProvider: 'google',
        outcome: 'failure',
      },
    });
    res.status(500).json({ error: 'Google login failed' });
  }
});

// ------------------- Facebook Login -------------------
router.post('/facebook-login', authRateLimiter, async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing Facebook access token' });
  }

  try {
    const graphResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
      },
    });

    const fbUser = graphResponse.data || {};
    const facebookId = fbUser.id;
    const email = fbUser.email || `facebook_${facebookId}@noemail.local`;
    const name = fbUser.name || 'Facebook User';
    const picture = fbUser.picture?.data?.url || null;

    if (!facebookId) {
      return res.status(400).json({ error: 'Invalid Facebook token' });
    }

    let user = await findUserByEmailOrFacebookId({ email, facebookId });

    if (!user) {
      user = await createUser({
        _id: createObjectId(),
        email,
        name,
        facebookId,
        profilePic: picture,
        role: ROLE_PATIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (!user.facebookId || user.profilePic !== picture || user.name !== name) {
      user = await updateUser(user._id, {
        facebookId,
        profilePic: picture || user.profilePic || null,
        name: name || user.name,
        updatedAt: new Date(),
      });
    }

    user = await normalizeUserRoleInDb(null, user);

    const profileData = await findProfileByUserId(user._id);
    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());
    await req.logAuditEvent?.({
      action: 'user_login',
      resourceType: 'auth',
      resourceId: user._id,
      metadata: {
        authProvider: 'facebook',
        outcome: 'success',
      },
    });

    if (profileData) {
      delete profileData._id;
    }

    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      token,
      ...(profileData || {}),
    });
  } catch {
    await req.logAuditEvent?.({
      action: 'user_login_failed',
      resourceType: 'auth',
      resourceId: req.body?.email || 'facebook-login',
      metadata: {
        authProvider: 'facebook',
        outcome: 'failure',
      },
    });
    return res.status(401).json({ error: 'Facebook login failed' });
  }
});

// ------------------- Signup -------------------
router.post('/signup', authRateLimiter, async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await createUser({
      _id: createObjectId(),
      email,
      name,
      password: hashedPassword,
      role: ROLE_PATIENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());
    await req.logAuditEvent?.({
      action: 'user_login',
      resourceType: 'auth',
      resourceId: user._id,
      metadata: {
        authProvider: 'password',
        outcome: 'signup',
      },
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });

  } catch {
    console.error('[auth] signup failed');
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ------------------- Doctor Signup (Pending Approval) -------------------
router.post('/signup-doctor', authRateLimiter, async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({
      _id: createObjectId(),
      email,
      name,
      password: hashedPassword,
      role: ROLE_PENDING_DOCTOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());
    await req.logAuditEvent?.({
      action: 'user_login',
      resourceType: 'auth',
      resourceId: user._id,
      metadata: {
        authProvider: 'password',
        outcome: 'doctor-signup',
      },
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
      message: 'Doctor application submitted and pending admin approval.',
    });
  } catch {
    res.status(500).json({ error: 'Doctor signup failed' });
  }
});

// ------------------- Request Doctor Access -------------------
router.post(
  '/request-doctor-access',
  authenticateJWT(),
  requirePermission('request_doctor_access'),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await findUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (normalizeStoredRole(user.role) === 'doctor') {
        return res.status(400).json({ error: 'User is already an approved doctor' });
      }
      if (normalizeStoredRole(user.role) === ROLE_PENDING_DOCTOR) {
        return res.status(400).json({ error: 'Doctor application is already pending review' });
      }

      const updatedUser = await updateUser(userId, { role: ROLE_PENDING_DOCTOR, updatedAt: new Date() });
      const token = generateToken({ _id: updatedUser._id, email: updatedUser.email, role: updatedUser.role });
      res.cookie('auth_token', token, getCookieOptions());
      await req.logAuditEvent?.({
        action: 'change_user_role',
        resourceType: 'user',
        resourceId: updatedUser._id,
        metadata: {
          previousRole: user.role,
          newRole: updatedUser.role,
          initiatedBy: userId,
        },
      });

      return res.json({ success: true, role: ROLE_PENDING_DOCTOR });
    } catch {
      return res.status(500).json({ error: 'Failed to submit doctor application' });
    }
  }
);

// ------------------- Login -------------------
router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user = await findUserByEmail(email);
    if (!user) {
      await req.logAuditEvent?.({
        action: 'user_login_failed',
        resourceType: 'auth',
        resourceId: email,
        metadata: {
          authProvider: 'password',
          outcome: 'user_not_found',
        },
      });
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await req.logAuditEvent?.({
        action: 'user_login_failed',
        resourceType: 'auth',
        resourceId: user._id,
        metadata: {
          authProvider: 'password',
          outcome: 'invalid_password',
        },
      });
      return res.status(401).json({ error: 'Invalid password' });
    }

    user = await normalizeUserRoleInDb(null, user);

    // Fetch extended profile data if it exists in the new separate entity
    const profileData = await findProfileByUserId(user._id);

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());
    await req.logAuditEvent?.({
      action: 'user_login',
      resourceType: 'auth',
      resourceId: user._id,
      metadata: {
        authProvider: 'password',
        outcome: 'success',
      },
    });

    if (profileData) {
      delete profileData._id; // prevent overwriting user._id
    }

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      token,
      ...(profileData || {}), // Merge separated profile data smoothly
    });

  } catch {
    console.error('[auth] login failed');
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.auth_token;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
  const token = bearerToken || cookieToken;

  if (token) {
    try {
      const user = verifyToken(token);
      req.user = req.user || user;
      await req.logAuditEvent?.({
        action: 'user_logout',
        resourceType: 'auth',
        resourceId: user._id,
        metadata: {
          outcome: 'success',
        },
      });
    } catch {
      // Keep logout behavior unchanged if the token is already invalid.
    }
  }

  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
  res.json({ success: true });
});

module.exports = router;
