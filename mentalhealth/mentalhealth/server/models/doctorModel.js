const { query, withTransaction } = require("../config/database");
const { normalizeId } = require("./_shared");

function mapSlot(row) {
  return {
    _id: row.id,
    doctorId: row.doctor_user_id,
    doctorName: row.doctor_name,
    date: row.slot_date,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
  };
}

function mapDoctor(row, extras = {}) {
  if (!row) return null;
  return {
    _id: row.id || row.user_id,
    userId: row.user_id,
    name: row.name,
    specialty: row.specialty,
    bio: row.bio,
    contact: row.contact,
    profilePic: row.profile_pic,
    yearsOfExperience: row.years_of_experience,
    qualifications: row.qualifications,
    licenseNumber: row.license_number,
    statusMessage: row.status_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slots: extras.slots || [],
    appointments: extras.appointments || [],
    messages: extras.messages || [],
  };
}

async function listAllDoctors() {
  const result = await query(
    `SELECT * FROM doctors ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST`
  );
  const slotsByDoctor = await getSlotsByDoctorIds(result.rows.map((row) => row.user_id));
  return result.rows.map((row) => mapDoctor(row, { slots: slotsByDoctor.get(row.user_id) || [] }));
}

async function getSlotsByDoctorIds(doctorIds) {
  if (!doctorIds.length) return new Map();
  const result = await query(
    `SELECT * FROM doctor_slots WHERE doctor_user_id = ANY($1::text[]) ORDER BY slot_date, start_time`,
    [doctorIds.map(normalizeId)]
  );
  const grouped = new Map();
  for (const row of result.rows) {
    const slot = mapSlot(row);
    const entries = grouped.get(row.doctor_user_id) || [];
    entries.push(slot);
    grouped.set(row.doctor_user_id, entries);
  }
  return grouped;
}

async function getDoctorByUserId(userId) {
  const normalizedUserId = normalizeId(userId);
  const [doctorResult, slotsResult] = await Promise.all([
    query("SELECT * FROM doctors WHERE user_id = $1 LIMIT 1", [normalizedUserId]),
    query(
      `SELECT * FROM doctor_slots WHERE doctor_user_id = $1 ORDER BY slot_date, start_time`,
      [normalizedUserId]
    ),
  ]);
  return mapDoctor(doctorResult.rows[0], {
    slots: slotsResult.rows.map(mapSlot),
  });
}

async function upsertDoctorProfile(userId, updates) {
  const normalizedUserId = normalizeId(userId);
  const now = updates.updatedAt || new Date();
  const existing = await getDoctorByUserId(normalizedUserId);
  const result = await query(
    `INSERT INTO doctors (
      user_id, name, specialty, bio, contact, profile_pic, years_of_experience,
      qualifications, license_number, status_message, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      bio = EXCLUDED.bio,
      contact = EXCLUDED.contact,
      profile_pic = EXCLUDED.profile_pic,
      years_of_experience = EXCLUDED.years_of_experience,
      qualifications = EXCLUDED.qualifications,
      license_number = EXCLUDED.license_number,
      status_message = EXCLUDED.status_message,
      updated_at = EXCLUDED.updated_at
    RETURNING *`,
    [
      normalizedUserId,
      updates.name || null,
      updates.specialty || null,
      updates.bio || null,
      updates.contact || null,
      updates.profilePic || null,
      updates.yearsOfExperience || null,
      updates.qualifications || null,
      updates.licenseNumber || null,
      updates.statusMessage || null,
      existing?.createdAt || now,
      now,
    ]
  );
  return {
    doctor: mapDoctor(result.rows[0]),
    created: !existing,
  };
}

async function listAvailabilities() {
  const result = await query(
    "SELECT * FROM doctor_slots ORDER BY slot_date, start_time, doctor_name"
  );
  return result.rows.map(mapSlot);
}

function generateIntervals(startStr, endStr) {
  const intervals = [];
  let [startH, startM] = startStr.split(":").map(Number);
  let [endH, endM] = endStr.split(":").map(Number);
  let currentMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  while (currentMin + 30 <= endMin) {
    const h1 = String(Math.floor(currentMin / 60)).padStart(2, "0");
    const m1 = String(currentMin % 60).padStart(2, "0");
    const nextMin = currentMin + 30;
    const h2 = String(Math.floor(nextMin / 60)).padStart(2, "0");
    const m2 = String(nextMin % 60).padStart(2, "0");
    intervals.push({ startTime: `${h1}:${m1}`, endTime: `${h2}:${m2}` });
    currentMin = nextMin;
  }

  return intervals;
}

async function addDoctorSlots(userId, { date, startTime, endTime, slotIdFactory }) {
  const normalizedUserId = normalizeId(userId);
  const doctor = await getDoctorByUserId(normalizedUserId);
  if (!doctor) return { doctor: null, availabilities: [] };

  const intervals = generateIntervals(startTime, endTime);
  if (!intervals.length) return { doctor, availabilities: [] };

  return withTransaction(async (client) => {
    const availabilities = [];
    for (const interval of intervals) {
      const slotId = normalizeId(slotIdFactory());
      const params = [
        slotId,
        normalizedUserId,
        doctor.name || "Unknown Doctor",
        date,
        interval.startTime,
        interval.endTime,
        new Date(),
      ];
      await client.query(
        `INSERT INTO doctor_slots (id, doctor_user_id, doctor_name, slot_date, start_time, end_time, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        params
      );
      availabilities.push(
        mapSlot({
          id: slotId,
          doctor_user_id: normalizedUserId,
          doctor_name: doctor.name || "Unknown Doctor",
          slot_date: date,
          start_time: interval.startTime,
          end_time: interval.endTime,
          created_at: params[6],
        })
      );
    }
    return { doctor, availabilities };
  });
}

async function getDoctorSlots(userId) {
  const result = await query(
    `SELECT * FROM doctor_slots WHERE doctor_user_id = $1 ORDER BY slot_date, start_time`,
    [normalizeId(userId)]
  );
  return result.rows.map(mapSlot);
}

async function deleteDoctorSlot(userId, slotId) {
  const result = await query(
    "DELETE FROM doctor_slots WHERE doctor_user_id = $1 AND id = $2",
    [normalizeId(userId), normalizeId(slotId)]
  );
  return result.rowCount > 0;
}

async function updateDoctorSlot(userId, slotId, updates) {
  const result = await query(
    `UPDATE doctor_slots
     SET slot_date = $3, start_time = $4, end_time = $5
     WHERE doctor_user_id = $1 AND id = $2
     RETURNING *`,
    [
      normalizeId(userId),
      normalizeId(slotId),
      updates.date,
      updates.startTime,
      updates.endTime,
    ]
  );
  return result.rows[0] ? mapSlot(result.rows[0]) : null;
}

async function findDoctorMessages(userId) {
  const result = await query(
    `SELECT id, sender_name AS "from", content, message_date AS date, created_at
     FROM doctor_messages
     WHERE doctor_user_id = $1
     ORDER BY created_at DESC`,
    [normalizeId(userId)]
  );
  return result.rows.map((row) => ({
    id: row.id,
    from: row.from,
    content: row.content,
    date: row.date,
    createdAt: row.created_at,
  }));
}

module.exports = {
  mapDoctor,
  mapSlot,
  listAllDoctors,
  getDoctorByUserId,
  upsertDoctorProfile,
  listAvailabilities,
  addDoctorSlots,
  getDoctorSlots,
  deleteDoctorSlot,
  updateDoctorSlot,
  findDoctorMessages,
};
