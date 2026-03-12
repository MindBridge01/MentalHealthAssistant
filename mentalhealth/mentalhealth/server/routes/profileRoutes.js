const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { encryptClassifiedFields, decryptClassifiedFields } = require('../services/encryptionService');
const { findProfileByUserId, upsertProfile } = require('../models/profileModel');
const { findUserById, updateUser } = require('../models/userModel');

router.use(authenticateJWT());
router.use(authorizeRoles('patient', 'doctor', 'admin', 'pending-doctor'));

// ---------- Get user profile (self-only) ----------
router.get('/', requirePermission('view_own_profile'), async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const profile = await findProfileByUserId(userId);
    const decryptedProfile = decryptClassifiedFields(profile || {});
    const user = await findUserById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });
    await req.logAuditEvent?.({
      action: 'view_patient_record',
      resourceType: 'profile',
      resourceId: userId,
      metadata: {
        accessedUserId: userId,
        accessScope: 'self',
      },
    });
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

    await updateUser(userId, { name, email, profilePic, updatedAt: new Date() });

    await upsertProfile(userId, {
      ...encryptedProfile,
      updatedAt: new Date(),
    });

    await req.logAuditEvent?.({
      action: 'update_patient_record',
      resourceType: 'profile',
      resourceId: userId,
      metadata: {
        updatedUserId: userId,
        accessScope: 'self',
        updatedFields: Object.keys(req.body || {}).filter((key) => req.body[key] !== undefined),
      },
    });

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
    // Fetch user profile to get guardian email
    const profile = await findProfileByUserId(userId);
    const decryptedProfile = decryptClassifiedFields(profile || {});
    const user = await findUserById(userId);

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
