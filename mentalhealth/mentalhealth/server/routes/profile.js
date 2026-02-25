const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

router.put('/', async (req, res) => {
  const {
    name, email, profilePic,
    birthday, age, gender, phone, address, zipcode, country, city,
    guardianName, guardianPhone, guardianEmail, illnesses
  } = req.body;

  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Access the shared database instance from server.js
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    // 1. Update Core Auth Entity
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { name, email, profilePic, updatedAt: new Date() } }
    );

    // 2. Update Separate Profile Details Entity
    await db.collection('profiles').updateOne(
      { userId: new ObjectId(userId) }, // Reference to the user
      {
        $set: {
          name, email,
          birthday, age, gender, phone, address, zipcode, country, city,
          guardianName, guardianPhone, guardianEmail, illnesses,
          updatedAt: new Date()
        }
      },
      { upsert: true } // Creates the document if it doesn't already exist
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed', details: err.message });
  }
});

module.exports = router;