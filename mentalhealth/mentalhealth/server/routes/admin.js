// routes/admin.js
const express = require('express');
const router = express.Router();
const { getMongoClient } = require('../../api/lib/mongodb');
const { ObjectId } = require('mongodb');

// Import JWT middleware
const { authenticateJWT } = require('../middleware/authMiddleware');

// 🔒 Protect all admin routes
router.use(authenticateJWT('admin')); // Only admin can access these routes

// ------------------- Get pending doctor applications -------------------
router.get('/pending-doctors', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db();

    const pendingDoctors = await db.collection('users')
      .find({ role: 'pending-doctor' })
      .toArray();

    res.json(pendingDoctors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending doctors', details: err.message });
  }
});

// ------------------- Approve doctor application -------------------
router.post('/approve-doctor', async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

  try {
    const client = await getMongoClient();
    const db = client.db();

    await db.collection('users').updateOne(
      { _id: new ObjectId(doctorId) },
      { $set: { role: 'doctor' } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve doctor', details: err.message });
  }
});

// ------------------- Reject doctor application -------------------
router.post('/reject-doctor', async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

  try {
    const client = await getMongoClient();
    const db = client.db();

    await db.collection('users').deleteOne({ _id: new ObjectId(doctorId) });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject doctor', details: err.message });
  }
});

module.exports = router;