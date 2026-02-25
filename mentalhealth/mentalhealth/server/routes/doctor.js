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
// ---------- Update doctor profile (with upsert) ----------
router.put('/profile/:userId', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db();
    const userId = req.params.userId;

    const updates = {
      name: req.body.name,
      specialty: req.body.specialty,
      bio: req.body.bio,
      contact: req.body.contact,
      profilePic: req.body.profilePic, // match frontend field
      updatedAt: new Date(),
    };

    // Use upsert: true to create the document if it doesn't exist
    const result = await db.collection('doctors').updateOne(
      { userId: new ObjectId(userId) },
      { $set: updates },
      { upsert: true }
    );

    if (result.matchedCount === 0 && result.upsertedCount === 1) {
      // Doctor document created
      return res.json({ success: true, message: 'Doctor profile created' });
    }

    res.json({ success: true, message: 'Doctor profile updated' });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ---------- Add a new free slot ----------
router.post('/slots/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ error: 'Date, startTime, and endTime required' });

    const client = await getMongoClient();
    const db = client.db();

    const result = await db.collection('doctors').updateOne(
      { userId: new ObjectId(userId) },
      { $push: { slots: { date, startTime, endTime } } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Doctor not found' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Get doctor slots ----------
router.get('/slots/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const client = await getMongoClient();
    const db = client.db();

    const doctor = await db.collection('doctors').findOne(
      { userId: new ObjectId(userId) },
      { projection: { slots: 1 } }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ slots: doctor.slots || [] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------- Remove a slot ----------
router.delete('/slots/:userId/:slotId', async (req, res) => {
  try {
    const { userId, slotId } = req.params;

    const client = await getMongoClient();
    const db = client.db();

    const result = await db.collection('doctors').updateOne(
      { userId: new ObjectId(userId) },
      { $pull: { slots: { _id: new ObjectId(slotId) } } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: 'Doctor not found' });

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