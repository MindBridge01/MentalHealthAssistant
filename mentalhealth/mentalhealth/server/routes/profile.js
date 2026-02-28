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

// ---------- SOS Alert ----------
router.post('/sos', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    // Fetch user profile to get guardian email
    const profile = await db.collection('profiles').findOne({ userId: new ObjectId(userId) });
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!profile || !profile.guardianEmail) {
      return res.status(400).json({ error: 'No guardian email found in profile. Please update your profile settings with a Guardian Email.' });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const patientName = user.name || profile.name || 'A user';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: profile.guardianEmail,
      subject: `🚨 EMERGENCY SOS ALERT from ${patientName} 🚨`,
      text: `EMERGENCY ALERT!\n\n${patientName} has triggered an SOS alert. Please contact them immediately.\n\nUser Details:\nName: ${patientName}\nPhone: ${profile.phone || 'N/A'}\nEmail: ${user.email || profile.email || 'N/A'}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'SOS alert sent via email to guardian' });
  } catch (err) {
    console.error('SOS Error:', err);
    res.status(500).json({ error: 'Failed to send SOS alert', details: err.message });
  }
});

module.exports = router;