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

    // Backfill _id for any older slots that don't have one
    let needsUpdate = false;
    if (doctor.slots && Array.isArray(doctor.slots)) {
      doctor.slots.forEach(slot => {
        if (!slot._id) {
          slot._id = new ObjectId();
          needsUpdate = true;
        }
      });
      if (needsUpdate) {
        await db.collection('doctors').updateOne(
          { userId: new ObjectId(userId) },
          { $set: { slots: doctor.slots } }
        );
      }
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

    // Fetch doctor to get name
    const doctor = await db.collection('doctors').findOne({ userId: new ObjectId(userId) });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Helper to divide time into 30-min intervals
    const generateIntervals = (startStr, endStr) => {
      const intervals = [];
      let [startH, startM] = startStr.split(':').map(Number);
      let [endH, endM] = endStr.split(':').map(Number);

      let currentMin = startH * 60 + startM;
      let endMin = endH * 60 + endM;

      while (currentMin + 30 <= endMin) {
        const h1 = Math.floor(currentMin / 60).toString().padStart(2, '0');
        const m1 = (currentMin % 60).toString().padStart(2, '0');
        const nextMin = currentMin + 30;
        const h2 = Math.floor(nextMin / 60).toString().padStart(2, '0');
        const m2 = (nextMin % 60).toString().padStart(2, '0');
        intervals.push({ startTime: `${h1}:${m1}`, endTime: `${h2}:${m2}` });
        currentMin = nextMin;
      }
      return intervals;
    };

    const slotsToCreate = generateIntervals(startTime, endTime);
    if (slotsToCreate.length === 0) {
      return res.status(400).json({ error: 'Time range must be at least 30 minutes' });
    }

    const availabilities = [];
    const internalSlots = [];

    for (const slot of slotsToCreate) {
      const slotId = new ObjectId();
      const newAvailability = {
        _id: slotId,
        doctorId: userId,
        doctorName: doctor.name || "Unknown Doctor",
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        createdAt: new Date()
      };
      availabilities.push(newAvailability);
      internalSlots.push({ _id: slotId, date, startTime: slot.startTime, endTime: slot.endTime });
    }

    // 1. Add to separate doctor_availability entity
    await db.collection('doctor_availability').insertMany(availabilities);

    // 2. Add to doctor's internal array (for backwards compat)
    await db.collection('doctors').updateOne(
      { userId: new ObjectId(userId) },
      { $push: { slots: { $each: internalSlots } } }
    );

    res.json({ success: true, availabilities });
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

    if (!slotId || slotId === 'undefined') {
      return res.status(400).json({ error: 'Invalid slot ID. Please refresh your browser.' });
    }

    const client = await getMongoClient();
    const db = client.db();

    // 1. Remove from separate doctor_availability collection
    await db.collection('doctor_availability').deleteOne({ _id: new ObjectId(slotId) });

    // 2. Remove from doctor internal array
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

// ---------- Edit a slot ----------
router.put('/slots/:userId/:slotId', async (req, res) => {
  try {
    const { userId, slotId } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) return res.status(400).json({ error: 'Date, startTime, and endTime required' });

    if (!slotId || slotId === 'undefined') {
      return res.status(400).json({ error: 'Invalid slot ID. Please refresh your browser.' });
    }

    const client = await getMongoClient();
    const db = client.db();

    // 1. Update separate doctor_availability collection
    await db.collection('doctor_availability').updateOne(
      { _id: new ObjectId(slotId) },
      {
        $set: {
          date: date,
          startTime: startTime,
          endTime: endTime
        }
      }
    );

    // 2. Update doctor internal array
    const result = await db.collection('doctors').updateOne(
      {
        userId: new ObjectId(userId),
        "slots._id": new ObjectId(slotId)
      },
      {
        $set: {
          "slots.$.date": date,
          "slots.$.startTime": startTime,
          "slots.$.endTime": endTime
        }
      }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: 'Doctor or slot not found' });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Get all availability records (New Entity endpoint) ----------
router.get('/availabilities', async (req, res) => {
  try {
    const client = await getMongoClient();
    const db = client.db();

    // Fetch all available slots from the standalone collection
    const availabilities = await db.collection('doctor_availability').find({}).toArray();
    res.json(availabilities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------- Create an appointment ----------
router.post('/appointments/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId, patientName, patientEmail, slotDate, slotTime, notes, slotId } = req.body;

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

    // 3. Remove the booked slot so no other patient can book it
    if (slotId) {
      await db.collection('doctor_availability').deleteOne({ _id: new ObjectId(slotId) });
      await db.collection('doctors').updateOne(
        { userId: new ObjectId(doctorId) },
        { $pull: { slots: { _id: new ObjectId(slotId) } } }
      );
    } else {
      // Fallback: split the slotTime string and pull by values
      const parts = slotTime.split(' - ');
      if (parts.length === 2) {
        const [st, et] = parts;
        await db.collection('doctor_availability').deleteOne({
          doctorId: doctorId,
          date: slotDate,
          startTime: st,
          endTime: et
        });
        await db.collection('doctors').updateOne(
          { userId: new ObjectId(doctorId) },
          { $pull: { slots: { date: slotDate, startTime: st, endTime: et } } }
        );
      }
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