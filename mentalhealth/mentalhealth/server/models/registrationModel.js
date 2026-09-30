const { query, withTransaction } = require('../config/database');
const { encryptValue, decryptValue } = require('../services/encryptionService');

function mapApplication(row, includeClinical = true) {
  if (!row) return null;
  const details = decryptValue(row.details);
  if (!includeClinical) {
    delete details.careContext;
    delete details.previousCare;
    delete details.contactName;
    delete details.contactPhone;
    delete details.contactRelationship;
  }
  return { userId: row.user_id, details, status: row.status, version: row.version,
    reviewNote: row.review_note ? decryptValue(row.review_note) : '',
    submittedAt: row.submitted_at, reviewedAt: row.reviewed_at };
}

async function getApplication(userId) {
  const result = await query('SELECT * FROM patient_registrations WHERE user_id = $1', [userId]);
  return mapApplication(result.rows[0]);
}

async function getRegistrationStatus(userId) {
  const result = await query('SELECT status FROM patient_registrations WHERE user_id = $1', [userId]);
  return result.rows[0]?.status || 'not_submitted';
}

async function submitApplication(userId, details) {
  return withTransaction(async (client) => {
    const result = await client.query(`INSERT INTO patient_registrations (user_id, details, status, consent_version)
      VALUES ($1,$2,'submitted','registration-v1')
      ON CONFLICT (user_id) DO UPDATE SET details = EXCLUDED.details, status = 'submitted',
      version = patient_registrations.version + 1, submitted_at = NOW(), reviewed_at = NULL,
      reviewed_by = NULL, review_note = NULL, consent_version = EXCLUDED.consent_version
      WHERE patient_registrations.status IN ('needs_information','declined') RETURNING *`,
    [userId, JSON.stringify(encryptValue(details))]);
    if (!result.rows[0]) return null;
    await client.query('UPDATE users SET name = $2, updated_at = NOW() WHERE id = $1', [userId, details.name]);
    await client.query(`INSERT INTO patient_registration_events (user_id, actor_id, status, version)
      VALUES ($1,$1,'submitted',$2)`, [userId, result.rows[0].version]);
    return mapApplication(result.rows[0]);
  });
}

async function listApplications() {
  const result = await query(`SELECT r.* FROM patient_registrations r JOIN users u ON u.id = r.user_id
    WHERE u.role = 'patient' AND r.status IN ('submitted','needs_information') ORDER BY r.submitted_at ASC LIMIT 100`);
  return result.rows.map((row) => mapApplication(row, false));
}

async function reviewApplication(userId, actorId, decision) {
  return withTransaction(async (client) => {
    const result = await client.query(`UPDATE patient_registrations SET status = $2, review_note = $3,
      reviewed_at = NOW(), reviewed_by = $4, version = version + 1
      WHERE user_id = $1 AND status = 'submitted' AND version = $5 RETURNING *`,
    [userId, decision.status, JSON.stringify(encryptValue(decision.note.trim())), actorId, decision.version]);
    if (!result.rows[0]) return null;
    // Record the decision in the same transaction; clinical context never enters the admin response.
    await client.query(`INSERT INTO patient_registration_events (user_id, actor_id, status, version, note)
      VALUES ($1,$2,$3,$4,$5)`, [userId, actorId, decision.status, result.rows[0].version, result.rows[0].review_note]);
    return mapApplication(result.rows[0], false);
  });
}

module.exports = { getApplication, getRegistrationStatus, submitApplication, listApplications, reviewApplication };
