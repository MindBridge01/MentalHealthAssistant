// routes/doctor.js
const express = require('express');
const router = express.Router();
const { getMongoClient } = require('../../api/lib/mongodb');
const { ObjectId } = require('mongodb');

// ---------- Get doctor profile ----------
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const client = await getMongoClient();
    const db = client.db();

    const doctor = await db.collection('doctors').findOne({ userId: new ObjectId(userId) });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Update doctor profile ----------
// routes/doctor.js
router.put('/profile/:userId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.params.userId;

    if (!db) return res.status(500).json({ error: "Database not connected" });

    const updates = { ...req.body, updatedAt: new Date() };

    const result = await db.collection('doctors').updateOne(
      { _id: new ObjectId(userId) }, // <--- usually _id is ObjectId
      { $set: updates }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Doctor not found' });

    res.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Add a new free slot ----------
router.post('/slots/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ error: 'Date and time required' });

    const client = await getMongoClient();
    const db = client.db();

    const result = await db.collection('doctors').updateOne(
      { userId: new ObjectId(userId) },
      { $push: { slots: { date, time } } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Doctor not found' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Remove a slot ----------
router.delete('/slots/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ error: 'Date and time required' });

    const client = await getMongoClient();
    const db = client.db();

    const result = await db.collection('doctors').updateOne(
      { userId: new ObjectId(userId) },
      { $pull: { slots: { date, time } } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Doctor not found' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Fetch appointments ----------
router.get('/appointments/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const client = await getMongoClient();
    const db = client.db();

    const doctor = await db.collection('doctors').findOne(
      { userId: new ObjectId(userId) },
      { projection: { appointments: 1 } }
    );

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    res.json({ appointments: doctor.appointments || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Fetch messages ----------
router.get('/messages/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const client = await getMongoClient();
    const db = client.db();

    const doctor = await db.collection('doctors').findOne(
      { userId: new ObjectId(userId) },
      { projection: { messages: 1 } }
    );

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    res.json({ messages: doctor.messages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;