const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { encryptClassifiedFields, decryptClassifiedFields } = require('../services/encryptionService');
const {
  listAllDoctors,
  getDoctorByUserId,
  upsertDoctorProfile,
  addDoctorSlots,
  getDoctorSlots,
  deleteDoctorSlot,
  updateDoctorSlot,
  listAvailabilities,
  findDoctorMessages,
} = require('../models/doctorModel');
const {
  createAppointment,
  findAppointmentsByPatientId,
  findAppointmentsByDoctorId,
} = require('../models/appointmentModel');
const { createObjectId } = require('../lib/objectId');

router.use(authenticateJWT());

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function requireDoctorOwnership(paramKey = 'userId') {
  return (req, res, next) => {
    if (req.user?.role !== 'doctor') {
      return res.status(403).json({ error: 'Doctor access required' });
    }

    const resourceUserId = req.params[paramKey];
    if (String(resourceUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot access another doctor resource' });
    }
    return next();
  };
}

function requirePatientOwnership(paramKey = 'patientId') {
  return (req, res, next) => {
    if (isAdmin(req) || req.user?.role === 'doctor') return next();
    if (req.user?.role !== 'patient') {
      return res.status(403).json({ error: 'Patient access required' });
    }

    const resourcePatientId = req.params[paramKey];
    if (String(resourcePatientId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot access another patient resource' });
    }
    return next();
  };
}

// ---------- Doctor Onboarding ----------
router.put(
  '/onboarding',
  authorizeRoles('doctor', 'pending-doctor'),
  async (req, res) => {
    const {
      name,
      specialty,
      bio,
      contact,
      yearsOfExperience,
      qualifications,
      licenseNumber,
      consentAccepted,
    } = req.body || {};

    if (!name || !specialty || !licenseNumber || !consentAccepted) {
      return res.status(400).json({ error: 'Please complete the required onboarding details.' });
    }

    try {
      const userId = req.user._id;
      const { updateUser } = require('../models/userModel');
      const { upsertProfile } = require('../models/profileModel');

      // 1. Update user name
      await updateUser(userId, { name, updatedAt: new Date() });

      // 2. Update doctor profile
      await upsertDoctorProfile(userId, {
        name,
        specialty,
        bio,
        contact,
        yearsOfExperience,
        qualifications,
        licenseNumber,
        updatedAt: new Date(),
      });

      // 3. Mark onboarding as complete in profiles table
      await upsertProfile(userId, {
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({ success: true, onboardingCompleted: true });
    } catch (err) {
      console.error('[doctor] onboarding failed', err);
      res.status(500).json({ error: 'Failed to save doctor onboarding details' });
    }
  }
);

// ---------- Get all doctors ----------
router.get('/all', authorizeRoles('patient', 'doctor', 'admin'), async (req, res) => {
  try {
    const doctors = await listAllDoctors();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Get doctor profile ----------
router.get('/profile/:userId', authorizeRoles('patient', 'doctor', 'pending-doctor', 'admin'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const doctor = await getDoctorByUserId(userId);
    if (!doctor) {
      return res.json({ name: '', specialty: '', bio: '', contact: '', profilePic: '' });
    }

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Update doctor profile (with upsert) ----------
router.put(
  '/profile/:userId',
  authorizeRoles('doctor'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await upsertDoctorProfile(userId, {
      name: req.body.name,
      specialty: req.body.specialty,
      bio: req.body.bio,
      contact: req.body.contact,
      profilePic: req.body.profilePic, // match frontend field
      yearsOfExperience: req.body.yearsOfExperience,
      qualifications: req.body.qualifications,
      licenseNumber: req.body.licenseNumber,
      statusMessage: req.body.statusMessage,
      updatedAt: new Date(),
    });

    if (result.created) {
      return res.json({ success: true, message: 'Doctor profile created' });
    }

    res.json({ success: true, message: 'Doctor profile updated' });
  } catch (err) {
    console.error('[doctor] profile update failed');
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Add a new free slot ----------
router.post(
  '/slots/:userId',
  authorizeRoles('doctor'),
  requirePermission('update_slots'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const userId = req.params.userId;
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ error: 'Date, startTime, and endTime required' });

    const { doctor, availabilities } = await addDoctorSlots(userId, {
      date,
      startTime,
      endTime,
      slotIdFactory: createObjectId,
    });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    if (availabilities.length === 0) {
      return res.status(400).json({ error: 'Time range must be at least 30 minutes' });
    }

    res.json({ success: true, availabilities });
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Get doctor slots ----------
router.get(
  '/slots/:userId',
  authorizeRoles('doctor'),
  requirePermission('update_slots'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const userId = req.params.userId;
    const doctor = await getDoctorByUserId(userId);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ slots: doctor.slots || [] });

  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});
// ---------- Remove a slot ----------
router.delete(
  '/slots/:userId/:slotId',
  authorizeRoles('doctor'),
  requirePermission('update_slots'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const { userId, slotId } = req.params;

    if (!slotId || slotId === 'undefined') {
      return res.status(400).json({ error: 'Invalid slot ID. Please refresh your browser.' });
    }

    const removed = await deleteDoctorSlot(userId, slotId);
    if (!removed)
      return res.status(404).json({ error: 'Doctor not found' });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Edit a slot ----------
router.put(
  '/slots/:userId/:slotId',
  authorizeRoles('doctor'),
  requirePermission('update_slots'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const { userId, slotId } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) return res.status(400).json({ error: 'Date, startTime, and endTime required' });

    if (!slotId || slotId === 'undefined') {
      return res.status(400).json({ error: 'Invalid slot ID. Please refresh your browser.' });
    }

    const updatedSlot = await updateDoctorSlot(userId, slotId, { date, startTime, endTime });
    if (!updatedSlot)
      return res.status(404).json({ error: 'Doctor or slot not found' });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Get all availability records (New Entity endpoint) ----------
router.get('/availabilities', authorizeRoles('patient', 'doctor', 'admin'), async (req, res) => {
  try {
    const availabilities = await listAvailabilities();
    res.json(availabilities);
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});
// ---------- Create an appointment ----------
router.post('/appointments/:doctorId', authorizeRoles('patient'), requirePermission('create_appointment'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId, patientName, patientEmail, slotDate, slotTime, notes, slotId } = req.body;
    const normalizedPatientId = req.user.role === 'patient' ? String(req.user._id) : patientId;

    if (req.user.role === 'patient' && patientId && String(patientId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot create appointment for another patient' });
    }

    if (!normalizedPatientId || !slotDate || !slotTime) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }

    // Create a robust appointment object including the patient email
    const protectedAppointmentData = encryptClassifiedFields({
      patient: patientName || "Unknown Patient",
      patientEmail: patientEmail || "",
      notes: notes || "",
    });

    const newAppointment = {
      _id: createObjectId(),
      doctorId: doctorId,
      patientId: normalizedPatientId,
      patient: protectedAppointmentData.patient,
      patientEmail: protectedAppointmentData.patientEmail,
      date: slotDate,
      time: slotTime,
      notes: protectedAppointmentData.notes,
      status: "Upcoming",
      createdAt: new Date()
    };

    const doctor = await getDoctorByUserId(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const doctorAppointmentCopy = await createAppointment(newAppointment, {
      slotId,
      slotDate,
      slotTimeParts: slotTime.split(' - '),
    });

    await req.logAuditEvent?.({
      action: 'create_appointment',
      resourceType: 'appointment',
      resourceId: doctorAppointmentCopy?._id || newAppointment._id,
      metadata: {
        doctorId,
        patientId: normalizedPatientId,
        slotDate,
        slotTime,
      },
    });

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: decryptClassifiedFields(doctorAppointmentCopy),
    });
  } catch (err) {
    console.error('[doctor] appointment booking failed');
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Fetch patient's appointments ----------
router.get(
  '/patient-appointments/:patientId',
  authorizeRoles('patient'),
  requirePermission('view_own_appointments'),
  requirePatientOwnership('patientId'),
  async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await findAppointmentsByPatientId(patientId);

    // Join doctor names dynamically
    const populated = await Promise.all(appointments.map(async (appt) => {
      const doctor = await getDoctorByUserId(appt.doctorId);
      return {
        ...decryptClassifiedFields(appt),
        doctorName: doctor ? doctor.name : 'Unknown Doctor'
      };
    }));

    await req.logAuditEvent?.({
      action: 'view_patient_record',
      resourceType: 'appointment',
      resourceId: patientId,
      metadata: {
        accessedPatientId: patientId,
        appointmentCount: populated.length,
        accessorType: 'patient',
      },
    });

    res.json({ appointments: populated });
  } catch (err) {
    console.error('[doctor] patient appointment fetch failed');
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Fetch appointments ----------
router.get(
  '/appointments/:userId',
  authorizeRoles('doctor'),
  requirePermission('manage_appointments'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const userId = req.params.userId;
    const doctor = await getDoctorByUserId(userId);

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const appointments = await findAppointmentsByDoctorId(userId);
    const decryptedAppointments = appointments.map((appointment) =>
      decryptClassifiedFields(appointment)
    );
    await req.logAuditEvent?.({
      action: 'view_patient_record',
      resourceType: 'appointment',
      resourceId: userId,
      metadata: {
        doctorId: userId,
        appointmentCount: decryptedAppointments.length,
        accessorType: 'doctor',
      },
    });
    res.json({ appointments: decryptedAppointments });
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ---------- Fetch messages ----------
router.get(
  '/messages/:userId',
  authorizeRoles('doctor'),
  requirePermission('manage_appointments'),
  requireDoctorOwnership('userId'),
  async (req, res) => {
  try {
    const userId = req.params.userId;
    const doctor = await getDoctorByUserId(userId);

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const messages = await findDoctorMessages(userId);
    await req.logAuditEvent?.({
      action: 'view_chat_history',
      resourceType: 'doctor_messages',
      resourceId: userId,
      metadata: {
        doctorId: userId,
        messageCount: messages.length,
        accessorType: 'doctor',
      },
    });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

module.exports = router;
