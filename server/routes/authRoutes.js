// routes/auth.js
const express = require('express');
const router = express.Router();
router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;
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
const { upsertDoctorProfile } = require('../models/doctorModel');
const { createDocApplication } = require('../models/docApplicationModel');
const { createObjectId } = require('../lib/objectId');
const { signupFailure } = require('../services/signupDiagnostics');

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
  if (normalized === ROLE_PATIENT || normalized === ROLE_PENDING_DOCTOR || normalized === 'doctor' || normalized === 'hospital' || normalized === ROLE_ADMIN) {
    return normalized;
  }
  throw Object.assign(new Error("Account role is invalid. Contact support."), {status:403});
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
  if(GOOGLE_CLIENT_ID==='YOUR_GOOGLE_CLIENT_ID') return res.status(503).json({error:'Google sign-in is not configured. Use email and password.'});
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Missing Google ID token' });
  }

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const { resolveGoogleIdentity } = require('../services/googleIdentity');
    let user = await resolveGoogleIdentity(ticket.getPayload(), require('../models/userModel'), createObjectId);

    user = await normalizeUserRoleInDb(null, user);
    const challenge=await require('../services/authSecurity').begin(require('../config/database'),user);
    if(challenge){res.clearCookie('auth_token',getCookieOptions());res.cookie('auth_step',challenge.token,{...getCookieOptions(),maxAge:600000});return res.json({requiresMfa:true,requiresMfaSetup:challenge.requiresMfaSetup});}


    // Fetch extended profile data if it exists in the new separate entity
    const profileData = await findProfileByUserId(user._id);

    const token = await require('../services/authSecurity').issue(require('../config/database'), user);
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
      ...(profileData || {}), // Merge separated profile data smoothly
    });

  } catch (error) {
    if (error.status) return res.status(error.status).json({error:error.message});
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
    res.status(401).json({ error: 'Google sign-in could not be verified. Please try again.' });
  }
});

// Only verified Google patient identities and local staff sign-in are supported.
router.post('/facebook-login', (_req,res)=>res.status(410).json({error:'Use local sign-in or Google for patient accounts.'}));

// ------------------- Signup -------------------
router.post('/signup', authRateLimiter, async (req, res) => {
  const { name, password } = req.body;
  const email=typeof req.body.email==='string'?req.body.email.trim().toLowerCase():'';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof name!=='string' || !name.trim() || name.length>250 || typeof password!=='string' || password.length<15 || Buffer.byteLength(password)>72) {
    return res.status(400).json({ error: 'Provide your name, valid email, and a password of at least 15 characters (maximum 72 bytes).' });
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

    const token = await require('../services/authSecurity').issue(require('../config/database'), user);
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
    });

  } catch (error) {
    const failure = signupFailure(error);
    // Never log database messages/detail: these can contain credentials or personal data.
    console.error(`[auth] signup failed: ${failure.diagnostic}`);
    res.status(failure.status).json({ error: failure.message });
  }
});

// ------------------- Doctor Signup (Pending Approval) -------------------
router.post('/signup-doctor', authRateLimiter, async (req, res) => {
  const { email, name, password } = req.body;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof name !== 'string' || !name.trim() || name.length > 250 || typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password) > 72 || password === 'PENDING_APPROVAL_123!') {
    return res.status(400).json({ error: 'Provide a name, valid email, and your own password (12-72 bytes).'  });
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

    const token = await require('../services/authSecurity').issue(require('../config/database'), user);
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
      message: 'Account created. Complete your professional registration to submit for review.',
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

      if(!user.password) return res.status(409).json({error:'Professional access requires a local account. Contact support before changing account type.'});
      const updatedUser = await updateUser(userId, { role: ROLE_PENDING_DOCTOR, updatedAt: new Date() });
      const token = await require('../services/authSecurity').issue(require('../config/database'), updatedUser);
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
  const { password, mfaCode } = req.body || {};
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  let stage = 'account_lookup';
  try {
    await require('../services/authSecurity').limitAccount(require('../config/database'),email);
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
      return res.status(401).json({ error: 'Email or password is incorrect. Use the email supplied when your account was created.' });
    }
    if (!user.password) return res.status(401).json({error:'Use the sign-in provider associated with this account.'});
    stage = 'password_check';
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
      return res.status(401).json({ error: 'Email or password is incorrect. Use the email supplied when your account was created.' });
    }

    stage = 'mfa_check';
    const security = require('../services/authSecurity');
    const challenge = await security.begin(require('../config/database'), user);
    if(challenge) {
      res.clearCookie('auth_token', getCookieOptions());
      res.cookie('auth_step', challenge.token, {...getCookieOptions(),maxAge:600000});
      return res.json({requiresMfa:true,requiresMfaSetup:challenge.requiresMfaSetup});
    }

    stage = 'role_lookup';
    user = await normalizeUserRoleInDb(null, user);

    // Fetch extended profile data if it exists in the new separate entity
    stage = 'profile_lookup';
    const profileData = await findProfileByUserId(user._id);

    stage = 'session_creation';
    const token = await require('../services/authSecurity').issue(require('../config/database'), user);
    res.cookie('auth_token', token, getCookieOptions());
    stage = 'login_audit';
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

    stage = 'response';
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      mfaEnabled: Boolean(user.mfaEnabled),
      ...(profileData || {}), // Merge separated profile data smoothly
    });

  } catch (error) {
    if(error.status) return res.status(error.status).json({error:error.message});
    const failure = require('../services/loginDiagnostics').loginFailure(error);
    console.error(`[auth] ${failure.diagnostic} stage=${stage}`);
    res.status(failure.status).json({ error: `${failure.message} Reference: ${failure.diagnostic}/${stage}`, diagnostic: failure.diagnostic, stage });
  }
});

// ------------------- Invitation Verification & Acceptance -------------------
const handleVerifyInvitation = async (req, res) => {
  const token = req.query?.token || req.body?.token;
  const { verifyInvitationToken } = require('../services/invitationService');
  const database = require('../config/database');
  try {
    const info = await verifyInvitationToken(database, token);
    res.json(info);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};
if (typeof router.get === 'function') router.get('/invitation/verify', handleVerifyInvitation);
router.post('/invitation/verify', handleVerifyInvitation);

router.post('/invitation/accept', authRateLimiter, async (req, res) => {
  const { token, password, mfaCode } = req.body || {};
  const { acceptHospitalOfficerInvitation } = require('../services/invitationService');
  const database = require('../config/database');
  try {
    // The invitation service reads the encrypted MFA secret from the database.
    // Never accept a replacement secret from the browser.
    const user = await acceptHospitalOfficerInvitation(database, { token, password, mfaCode });
    if(user.verificationError) return res.status(400).json({error:user.verificationError});
    const sessionToken = await require('../services/authSecurity').issue(database, await findUserById(user._id), true);
    res.cookie('auth_token', sessionToken, getCookieOptions());
    await req.logAuditEvent?.({
      action: 'accept_hospital_invitation',
      resourceType: 'auth',
      resourceId: user._id,
      metadata: {
        outcome: 'success',
        role: user.role,
      },
    });
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      recoveryCodes: user.recoveryCodes,
      mfaEnabled: true,
      hospitalId: user.hospitalId,
      hospitalName: user.hospitalName,
    });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// Limited challenges never grant access to protected APIs.
router.post('/mfa/setup', authRateLimiter, async (req,res)=>{
  res.set('Cache-Control','no-store');
  try { res.json(await require('../services/authSecurity').setup(require('../config/database'),req.cookies?.auth_step)); }
  catch(e){res.status(e.status||500).json({error:e.status?e.message:'MFA setup unavailable.'});}
});
router.post('/mfa/verify', authRateLimiter, async (req,res)=>{
  res.set('Cache-Control','no-store');
  try {
    const security=require('../services/authSecurity'), db=require('../config/database');
    const result=await security.finish(db,req.cookies?.auth_step,req.body?.mfaCode);
    const user=await findUserById(result.userId);
    const token=await security.issue(db,user,true);
    res.cookie('auth_token',token,getCookieOptions());
    res.clearCookie('auth_step',getCookieOptions());
    await req.logAuditEvent?.({action:'mfa_verified',resourceType:'auth',resourceId:user._id});
    res.json({_id:user._id,name:user.name,email:user.email,role:user.role,mfaEnabled:true,recoveryCodes:result.recoveryCodes});
  } catch(e){res.status(e.status||500).json({error:e.status?e.message:'Verification unavailable. Sign in again.'});}
});

router.post('/logout', async (req, res) => {
  if(req.cookies?.auth_step) { try { await require('../config/database').query('DELETE FROM auth_challenges WHERE token_hash=$1',[require('../services/authSecurity').digest(req.cookies.auth_step)]); } catch { /* Cookie removal still prevents local reuse. */ } }
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
      if(user.sid) await require('../config/database').query('DELETE FROM auth_sessions WHERE id=$1',[user.sid]);
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
