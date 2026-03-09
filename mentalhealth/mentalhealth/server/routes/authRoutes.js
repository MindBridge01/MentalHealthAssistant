// routes/auth.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { getMongoClient } = require('../config/database'); // adjust path
const { generateToken } = require('../lib/jwt'); // JWT helper
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requirePermission, normalizeRole } = require('../middleware/permissionMiddleware');
const axios = require('axios');

// Google Auth
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const isProduction = process.env.NODE_ENV === 'production';
const DB_NAME = process.env.MONGODB_DB_NAME || 'Mind_Bridge';
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
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { role: normalizedRole, updatedAt: new Date() } }
    );
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
router.post('/google-login', async (req, res) => {
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

    const dbClient = await getMongoClient();
    const db = dbClient.db(DB_NAME);

    // Check if user exists
    let user = await db.collection('users').findOne({ email });
    if (!user) {
      user = {
        email,
        name,
        googleId,
        profilePic: picture || null,
        role: ROLE_PATIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
    } else {
      const profilePic = picture || user.profilePic || null;
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { googleId: googleId || user.googleId, profilePic, name: name || user.name, updatedAt: new Date() } }
      );
      user.googleId = googleId || user.googleId;
      user.profilePic = profilePic;
      user.name = name || user.name;
    }

    user = await normalizeUserRoleInDb(db, user);

    // Fetch extended profile data if it exists in the new separate entity
    const profileData = await db.collection('profiles').findOne({ userId: user._id });

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());

    if (profileData) {
      delete profileData._id; // prevent overwriting user._id
    }

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      ...(profileData || {}), // Merge separated profile data smoothly
    });

  } catch (err) {
    console.error('[auth] google-login failed');
    res.status(500).json({ error: 'Google login failed' });
  }
});

// ------------------- Facebook Login -------------------
router.post('/facebook-login', async (req, res) => {
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

    const dbClient = await getMongoClient();
    const db = dbClient.db(DB_NAME);

    let user = await db.collection('users').findOne({
      $or: [{ facebookId }, { email }],
    });

    if (!user) {
      user = {
        email,
        name,
        facebookId,
        profilePic: picture,
        role: ROLE_PATIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
    } else if (!user.facebookId || user.profilePic !== picture || user.name !== name) {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            facebookId,
            profilePic: picture || user.profilePic || null,
            name: name || user.name,
            updatedAt: new Date(),
          },
        }
      );
      user.facebookId = facebookId;
      user.profilePic = picture || user.profilePic || null;
      user.name = name || user.name;
    }

    user = await normalizeUserRoleInDb(db, user);

    const profileData = await db.collection('profiles').findOne({ userId: user._id });
    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());

    if (profileData) {
      delete profileData._id;
    }

    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      ...(profileData || {}),
    });
  } catch (_err) {
    return res.status(401).json({ error: 'Facebook login failed' });
  }
});

// ------------------- Signup -------------------
router.post('/signup', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      email,
      name,
      password: hashedPassword,
      role: ROLE_PATIENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);

    const token = generateToken({ _id: result.insertedId, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());

    res.status(201).json({
      _id: result.insertedId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

  } catch (err) {
    console.error('[auth] signup failed');
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ------------------- Doctor Signup (Pending Approval) -------------------
router.post('/signup-doctor', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = {
      email,
      name,
      password: hashedPassword,
      role: ROLE_PENDING_DOCTOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);
    const token = generateToken({ _id: result.insertedId, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());

    res.status(201).json({
      _id: result.insertedId,
      email: user.email,
      name: user.name,
      role: user.role,
      message: 'Doctor application submitted and pending admin approval.',
    });
  } catch (_err) {
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
      const client = await getMongoClient();
      const db = client.db(DB_NAME);
      const userId = new ObjectId(req.user._id);

      const user = await db.collection('users').findOne({ _id: userId });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (normalizeStoredRole(user.role) === 'doctor') {
        return res.status(400).json({ error: 'User is already an approved doctor' });
      }
      if (normalizeStoredRole(user.role) === ROLE_PENDING_DOCTOR) {
        return res.status(400).json({ error: 'Doctor application is already pending review' });
      }

      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { role: ROLE_PENDING_DOCTOR, updatedAt: new Date() } }
      );

      const updatedUser = { ...user, role: ROLE_PENDING_DOCTOR };
      const token = generateToken({ _id: updatedUser._id, email: updatedUser.email, role: updatedUser.role });
      res.cookie('auth_token', token, getCookieOptions());

      return res.json({ success: true, role: ROLE_PENDING_DOCTOR });
    } catch (_err) {
      return res.status(500).json({ error: 'Failed to submit doctor application' });
    }
  }
);

// ------------------- Login -------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    let user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    user = await normalizeUserRoleInDb(db, user);

    // Fetch extended profile data if it exists in the new separate entity
    const profileData = await db.collection('profiles').findOne({ userId: user._id });

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    res.cookie('auth_token', token, getCookieOptions());

    if (profileData) {
      delete profileData._id; // prevent overwriting user._id
    }

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      ...(profileData || {}), // Merge separated profile data smoothly
    });

  } catch (err) {
    console.error('[auth] login failed');
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
  res.json({ success: true });
});

module.exports = router;
