// routes/admin.js
const express = require('express');
const router = express.Router();
const { getMongoClient } = require('../config/database');
const { ObjectId } = require('mongodb');
const DB_NAME = process.env.MONGODB_DB_NAME || 'Mind_Bridge';

// Import JWT middleware
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// 🔒 Protect all admin routes
router.use(authenticateJWT());
router.use(authorizeRoles('admin'));

// ------------------- Get pending doctor applications -------------------
router.get('/pending-doctors', requirePermission('approve_doctor'), async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    const pendingDoctors = await db.collection('users')
      .find({ role: 'pending-doctor' })
      .toArray();

    res.json(pendingDoctors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending doctors' });
  }
});

// ------------------- Approve doctor application -------------------
router.post('/approve-doctor', requirePermission('approve_doctor'), async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    await db.collection('users').updateOne(
      { _id: new ObjectId(doctorId) },
      { $set: { role: 'doctor' } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
});

// ------------------- Reject doctor application -------------------
router.post('/reject-doctor', requirePermission('reject_doctor'), async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    await db.collection('users').deleteOne({ _id: new ObjectId(doctorId) });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject doctor' });
  }
});

// ------------------- List users -------------------
router.get('/users', requirePermission('manage_users'), async (_req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);

    const users = await db.collection('users')
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(users);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
