// routes/auth.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { getMongoClient } = require('../../api/lib/mongodb'); // adjust path
const { generateToken } = require('../lib/jwt'); // JWT helper

// Google Auth
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const isProduction = process.env.NODE_ENV === 'production';

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
  const { idToken, role } = req.body;
  if (!idToken || !role) {
    return res.status(400).json({ error: 'Missing Google ID token or role' });
  }

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const dbClient = await getMongoClient();
    const db = dbClient.db();

    // Force admin role for your Gmail
    let userRole = role;
    if (email === 'lakshikahiruni20@gmail.com') userRole = 'admin';

    // Check if user exists
    let user = await db.collection('users').findOne({ email, googleId });
    if (!user) {
      user = {
        email,
        name,
        googleId,
        profilePic: picture || null,
        role: userRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
    }

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

// ------------------- Signup -------------------
router.post('/signup', async (req, res) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      email,
      name,
      password: hashedPassword,
      role,
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

// ------------------- Login -------------------
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role required' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (role === 'admin' && email !== 'lakshikahiruni20@gmail.com') {
      return res.status(403).json({ error: 'Access denied. Not authorized as admin.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }

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
