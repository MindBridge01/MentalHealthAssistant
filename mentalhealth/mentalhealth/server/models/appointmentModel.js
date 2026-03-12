const { query, withTransaction } = require("../config/database");
const { normalizeId, serializeJson } = require("./_shared");

function mapAppointment(row) {
  if (!row) return null;
  return {
    _id: row.id,
    doctorId: row.doctor_user_id,
    patientId: row.patient_user_id,
    patient: row.patient,
    patientEmail: row.patient_email,
    date: row.appointment_date,
    time: row.appointment_time,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    id: row.id,
  };
}

async function createAppointment(appointment, bookingMeta = {}) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO appointments (
        id, doctor_user_id, patient_user_id, patient, patient_email, appointment_date,
        appointment_time, notes, status, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        normalizeId(appointment._id),
        normalizeId(appointment.doctorId),
        normalizeId(appointment.patientId),
        serializeJson(appointment.patient),
        serializeJson(appointment.patientEmail),
        appointment.date,
        appointment.time,
        serializeJson(appointment.notes),
        appointment.status,
        appointment.createdAt || new Date(),
      ]
    );

    if (bookingMeta.slotId) {
      await client.query("DELETE FROM doctor_slots WHERE id = $1", [normalizeId(bookingMeta.slotId)]);
    } else if (bookingMeta.slotDate && bookingMeta.slotTimeParts?.length === 2) {
      await client.query(
        `DELETE FROM doctor_slots
         WHERE doctor_user_id = $1 AND slot_date = $2 AND start_time = $3 AND end_time = $4`,
        [
          normalizeId(appointment.doctorId),
          bookingMeta.slotDate,
          bookingMeta.slotTimeParts[0],
          bookingMeta.slotTimeParts[1],
        ]
      );
    }

    return mapAppointment(result.rows[0]);
  });
}

async function findAppointmentsByPatientId(patientId) {
  const result = await query(
    `SELECT * FROM appointments
     WHERE patient_user_id = $1
     ORDER BY created_at DESC`,
    [normalizeId(patientId)]
  );
  return result.rows.map(mapAppointment);
}

async function findAppointmentsByDoctorId(doctorId) {
  const result = await query(
    `SELECT * FROM appointments
     WHERE doctor_user_id = $1
     ORDER BY created_at DESC`,
    [normalizeId(doctorId)]
  );
  return result.rows.map(mapAppointment);
}

module.exports = {
  mapAppointment,
  createAppointment,
  findAppointmentsByPatientId,
  findAppointmentsByDoctorId,
};
