const express = require('express');
const router = express.Router();
const { getMongoClient } = require('../../api/lib/mongodb');
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
    const client = await getMongoClient();
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name, email, profilePic,
          birthday, age, gender, phone, address, zipcode, country, city,
          guardianName, guardianPhone, guardianEmail, illnesses,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: 'User not found' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed', details: err.message });
  }
});

module.exports = router;