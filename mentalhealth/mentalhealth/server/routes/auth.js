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

// ------------------- Google Login -------------------
router.post('/google-login', async (req, res) => {
  const { idToken, role } = req.body;
  if (!idToken || !role) {
    console.log('Google login: Missing token or role', req.body);
    return res.status(400).json({ error: 'Missing Google ID token or role' });
  }

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email || !googleId) {
      console.log('Google login: Invalid token payload', payload);
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
      console.log('Google login: New user created', user);
    } else {
      console.log('Google login: Existing user', user);
    }

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
      token
    });

  } catch (err) {
    console.error('Google login failed:', err);
    res.status(500).json({ error: 'Google login failed', details: err.message });
  }
});

// ------------------- Signup -------------------
router.post('/signup', async (req, res) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password || !role) {
    console.log('Signup: Missing fields', req.body);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      console.log('Signup: User already exists', email);
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
    console.log('Signup: New user created', user);

    const token = generateToken({ _id: result.insertedId, email: user.email, role: user.role });

    res.status(201).json({
      _id: result.insertedId,
      email: user.email,
      name: user.name,
      role: user.role,
      token
    });

  } catch (err) {
    console.error('Signup failed:', err);
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
});

// ------------------- Login -------------------
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  console.log('Login attempt:', { email, role });

  if (!email || !password || !role) {
    console.log('Login: Missing fields', req.body);
    return res.status(400).json({ error: 'Email, password, and role required' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('Login: User not found', email);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User fetched:', user);
    console.log('User password field:', user?.password);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login: Invalid password for', email);
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (role === 'admin' && email !== 'lakshikahiruni20@gmail.com') {
      console.log('Login: Unauthorized admin access attempt', email);
      return res.status(403).json({ error: 'Access denied. Not authorized as admin.' });
    }

    if (user.role !== role) {
      console.log('Login: Role mismatch', { email, dbRole: user.role, requestedRole: role });
      return res.status(403).json({ error: 'Role mismatch' });
    }

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });
    console.log('Login: Success', { email, role });

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token
    });

  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

module.exports = router;