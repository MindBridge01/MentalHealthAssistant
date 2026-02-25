const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// ---------- Update user profile (self-only) ----------
router.put('/', async (req, res) => {
  const userId = req.headers['x-user-id'];  // Only user can update their own profile
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    name, email, profilePic,
    birthday, age, gender, phone, address, zipcode, country, city,
    guardianName, guardianPhone, guardianEmail, illnesses
  } = req.body;

  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    // Update main users collection
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { name, email, profilePic, updatedAt: new Date() } }
    );

    // Update profile details collection
    await db.collection('profiles').updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: {
          name, email,
          birthday, age, gender, phone, address, zipcode, country, city,
          guardianName, guardianPhone, guardianEmail, illnesses,
          updatedAt: new Date()
        }
      },
      { upsert: true }  // create profile document if not exist
    );

    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile update failed', details: err.message });
  }
});

module.exports = router;