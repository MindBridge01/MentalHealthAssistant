const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

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

// ------------------- SOS Email -------------------
router.post('/sos', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    // Fetch user profile and core details
    const profile = await db.collection('profiles').findOne({ userId: new ObjectId(userId) });
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (!profile || !profile.guardianEmail) {
      return res.status(400).json({ error: 'Guardian email not configured in your profile settings.' });
    }

    // Configure Nodemailer transporter (fallback to ethereal test if no .env configured)
    let transporter;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      console.log("No EMAIL_USER and EMAIL_PASS found in .env, falling back to ethereal test account...");
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const patientName = profile.name || user.name || 'Your Ward';
    const GName = profile.guardianName || 'Guardian';

    const mailOptions = {
      from: process.env.EMAIL_USER || '"MindBridge alerts" <sos@mindbridge.com>',
      to: profile.guardianEmail,
      subject: `🚨 EMERGENCY: ${patientName} needs your help!`,
      text: `Hello ${GName},\n\nThis is an automated emergency pulse from MindBridge.\n\n${patientName} has just pressed the SOS Panic button, indicating they are in distress and require immediate assistance or a check-in.\n\nPlease attempt to contact them as soon as possible.\n\nEmergency Info Provided:\nPhone: ${profile.phone || 'N/A'}\nAddress: ${profile.address || 'N/A'}, ${profile.city || ''}\n\nStay safe,\nThe MindBridge Automated Assistant`,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("SOS Alert sent: %s", info.messageId);

    // Provide a test URL log if using ethereal
    if (!process.env.EMAIL_USER) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    res.json({ success: true, message: 'SOS email alert dispatched successfully to your guardian.' });
  } catch (err) {
    console.error('SOS email dispatch failed:', err);
    res.status(500).json({ error: 'Failed to dispatch SOS email', details: err.message });
  }
});

module.exports = router;