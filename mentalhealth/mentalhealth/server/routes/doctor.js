const express = require('express');
const router = express.Router();
const { getMongoClient } = require('../../api/lib/mongodb');
const { ObjectId } = require('mongodb');

// ---------- Get all doctors ----------
router.get('/all', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db();

    const doctors = await db.collection('doctors').find({}).toArray();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Get doctor profile ----------
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const client = await getMongoClient();
    const db = client.db();

    const doctor = await db.collection('doctors').findOne({ userId: new ObjectId(userId) });
    if (!doctor) {
      return res.json({ name: '', specialty: '', bio: '', contact: '', profilePic: '' });
    }

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
      yearsOfExperience: req.body.yearsOfExperience,
      qualifications: req.body.qualifications,
      licenseNumber: req.body.licenseNumber,
      statusMessage: req.body.statusMessage,
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
// ---------- Create an appointment ----------
router.post('/appointments/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId, patientName, patientEmail, slotDate, slotTime, notes } = req.body;

    if (!patientId || !slotDate || !slotTime) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }

    const client = await getMongoClient();
    const db = client.db();

    // Create a robust appointment object including the patient email
    const newAppointment = {
      _id: new ObjectId(),
      doctorId: doctorId,
      patientId,
      patient: patientName || "Unknown Patient",
      patientEmail: patientEmail || "",
      date: slotDate,
      time: slotTime,
      notes: notes || "",
      status: "Upcoming",
      createdAt: new Date()
    };

    // 1. Add appointment to a separate "appointments" database collection (creating a distinct entity)
    await db.collection('appointments').insertOne(newAppointment);

    // 2. Add a sub-copy of the appointment to the doctor's document array (using string id for backwards compat)
    const doctorAppointmentCopy = { ...newAppointment, id: newAppointment._id.toString() };

    const result = await db.collection('doctors').updateOne(
      { userId: new ObjectId(doctorId) },
      { $push: { appointments: doctorAppointmentCopy } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Appointment booked successfully', appointment: doctorAppointmentCopy });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Fetch patient's appointments ----------
router.get('/patient-appointments/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const client = await getMongoClient();
    const db = client.db();

    // Find all appointments that belong to this patient
    const appointments = await db.collection('appointments').find({ patientId }).toArray();

    // Join doctor names dynamically
    const populated = await Promise.all(appointments.map(async (appt) => {
      const doctor = await db.collection('doctors').findOne({ userId: new ObjectId(appt.doctorId) });
      return {
        ...appt,
        doctorName: doctor ? doctor.name : 'Unknown Doctor'
      };
    }));

    res.json({ appointments: populated });
  } catch (err) {
    console.error("Fetch patient appointments error:", err);
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