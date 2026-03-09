const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { encryptClassifiedFields, decryptClassifiedFields } = require('../services/encryptionService');

router.use(authenticateJWT());
router.use(authorizeRoles('patient', 'doctor', 'admin', 'pending-doctor'));

// ---------- Get user profile (self-only) ----------
router.get('/', requirePermission('view_own_profile'), async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    const profile = await db.collection('profiles').findOne({ userId: new ObjectId(userId) });
    const decryptedProfile = decryptClassifiedFields(profile || {});
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role === 'user' ? 'patient' : user.role,
      profilePic: user.profilePic,
      ...decryptedProfile,
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Profile fetch failed' });
  }
});

// ---------- Update user profile (self-only) ----------
router.put('/', requirePermission('edit_own_profile'), async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const {
    name, email, profilePic,
    birthday, age, gender, phone, address, zipcode, country, city,
    guardianName, guardianPhone, guardianEmail, illnesses
  } = req.body;

  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    const encryptedProfile = encryptClassifiedFields({
      name,
      email,
      birthday,
      age,
      gender,
      phone,
      address,
      zipcode,
      country,
      city,
      guardianName,
      guardianPhone,
      guardianEmail,
      illnesses,
    });

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
          ...encryptedProfile,
          updatedAt: new Date()
        }
      },
      { upsert: true }  // create profile document if not exist
    );

    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (err) {
    console.error('[profile] update failed');
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ---------- SOS Alert ----------
router.post('/sos', requirePermission('edit_own_profile'), async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'Database not connected' });

    // Fetch user profile to get guardian email
    const profile = await db.collection('profiles').findOne({ userId: new ObjectId(userId) });
    const decryptedProfile = decryptClassifiedFields(profile || {});
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!profile || !decryptedProfile.guardianEmail) {
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
      to: decryptedProfile.guardianEmail,
      subject: `🚨 EMERGENCY SOS ALERT from ${patientName} 🚨`,
      text: `EMERGENCY ALERT!\n\n${patientName} has triggered an SOS alert. Please contact them immediately.\n\nUser Details:\nName: ${patientName}\nPhone: ${decryptedProfile.phone || 'N/A'}\nEmail: ${user.email || decryptedProfile.email || 'N/A'}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'SOS alert sent via email to guardian' });
  } catch (err) {
    console.error('[profile] sos failed');
    res.status(500).json({ error: 'Failed to send SOS alert' });
  }
});

module.exports = router;
