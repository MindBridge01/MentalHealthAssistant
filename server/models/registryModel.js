const { withTransaction } = require('../config/database');
const { encryptValue, decryptValue } = require('../services/encryptionService');

function failure(message, status) { return Object.assign(new Error(message), { status }); }
function mapPatient(row, includeClinical = false) {
  return { id: row.id, userId: row.user_id, patientNumber: `MB-${String(row.patient_number).padStart(6, '0')}`,
    status: row.status, version: row.version, demographics: row.demographics ? decryptValue(row.demographics) : {},
    ...(includeClinical ? { clinicalContext: row.clinical_context ? decryptValue(row.clinical_context) : {} } : {}),
    createdAt: row.created_at, updatedAt: row.updated_at };
}
async function audit(client, actor, action, resourceId, metadata = {}) {
  await client.query(`INSERT INTO audit_logs(user_id, user_role, action, resource_type, resource_id, metadata)
    VALUES ($1,$2,$3,'patient_registry',$4,$5)`, [actor._id, actor.role, action, resourceId, JSON.stringify(metadata)]);
}

async function listPatients(actor, { limit, offset }) {
  return withTransaction(async (client) => {
    const result = await client.query(`SELECT p.* FROM patients p
      WHERE ($1 = 'admin' OR ($1 = 'doctor' AND p.status = 'active' AND EXISTS (
        SELECT 1 FROM care_team_assignments a JOIN users u ON u.id = a.provider_user_id
        WHERE a.patient_id = p.id AND a.provider_user_id = $2 AND u.role = 'doctor'
        AND a.revoked_at IS NULL AND a.starts_at <= NOW() AND (a.ends_at IS NULL OR a.ends_at > NOW())
      ))) ORDER BY p.patient_number LIMIT $3 OFFSET $4`, [actor.role, actor._id, limit + 1, offset]);
    const patients = result.rows.slice(0, limit).map((row) => mapPatient(row));
    await audit(client, actor, 'list_patients', null, { count: patients.length });
    return { patients, hasMore: result.rows.length > limit };
  });
}

async function readPatient(actor, patientId = null) {
  return withTransaction(async (client) => {
    const result = await client.query(`SELECT p.* FROM patients p
      WHERE ($1::uuid IS NOT NULL AND p.id = $1::uuid) OR ($1::uuid IS NULL AND p.user_id = $2)
      LIMIT 1`, [patientId, actor._id]);
    const row = result.rows[0];
    if (!row) throw failure('Patient record not found.', 404);
    const owner = row.user_id === actor._id && actor.role === 'patient';
    let includeClinical = owner;
    if (!owner && actor.role !== 'admin') {
      if (actor.role !== 'doctor' || row.status !== 'active') throw failure('Patient record not found.', 404);
      const permission = await client.query(`SELECT a.access_scope FROM care_team_assignments a
        JOIN users u ON u.id = a.provider_user_id WHERE a.patient_id = $1 AND a.provider_user_id = $2
        AND u.role = 'doctor' AND a.revoked_at IS NULL AND a.starts_at <= NOW()
        AND (a.ends_at IS NULL OR a.ends_at > NOW())`, [row.id, actor._id]);
      if (!permission.rows[0]) throw failure('Patient record not found.', 404);
      includeClinical = permission.rows[0].access_scope === 'clinical_context';
    }
    const patient = mapPatient(row, includeClinical);
    // Contacts and consent history are deliberately restricted to the patient, not every care-team member.
    if (owner) {
      const contacts = await client.query(`SELECT id, purpose, details, verified_at FROM patient_contacts
        WHERE patient_id = $1 AND archived_at IS NULL ORDER BY created_at`, [row.id]);
      patient.contacts = contacts.rows.map((contact) => ({ id: contact.id, purpose: contact.purpose,
        details: decryptValue(contact.details), verifiedAt: contact.verified_at }));
      const consent = await client.query(`SELECT DISTINCT ON (purpose) purpose, decision, policy_version, recorded_at
        FROM patient_consents WHERE patient_id = $1 ORDER BY purpose, event_sequence DESC`, [row.id]);
      patient.consentChoices = consent.rows;
    }
    if (owner || actor.role === 'admin') {
      const team = await client.query(`SELECT a.id, a.provider_user_id, d.name AS provider_name, a.access_scope,
        a.starts_at, a.ends_at, a.revoked_at FROM care_team_assignments a JOIN doctors d ON d.user_id = a.provider_user_id
        JOIN users u ON u.id = a.provider_user_id
        WHERE a.patient_id = $1 AND ($2::boolean OR (u.role = 'doctor' AND a.revoked_at IS NULL
        AND a.starts_at <= NOW() AND (a.ends_at IS NULL OR a.ends_at > NOW())))
        ORDER BY a.created_at`, [row.id, actor.role === 'admin']);
      patient.careTeam = team.rows;
    }
    await audit(client, actor, 'view_patient_registry', row.id, { scope: includeClinical ? 'clinical_context' : 'demographics' });
    return patient;
  });
}

async function changeReminderConsent(actor, enabled) {
  if (actor.role !== 'patient') throw failure('Patient access required.', 403);
  return withTransaction(async (client) => {
    const result = await client.query('SELECT id FROM patients WHERE user_id = $1 FOR UPDATE', [actor._id]);
    if (!result.rows[0]) throw failure('Submit registration before changing preferences.', 409);
    const patientId = result.rows[0].id;
    const consent = await client.query(`INSERT INTO patient_consents
      (patient_id, purpose, decision, policy_version, actor_user_id)
      VALUES ($1,'appointment_email_reminders',$2,'reminders-v1',$3)
      RETURNING id, purpose, decision, policy_version, recorded_at`, [patientId, enabled ? 'granted' : 'withdrawn', actor._id]);
    await audit(client, actor, 'change_reminder_consent', patientId, { enabled });
    return consent.rows[0];
  });
}

async function assignProvider(actor, patientId, input) {
  if (actor.role !== 'admin') throw failure('Administrator access required.', 403);
  return withTransaction(async (client) => {
    // Serialize assignments for a patient so two admins cannot create conflicting active relationships.
    const patient = await client.query('SELECT id, status FROM patients WHERE id = $1 FOR UPDATE', [patientId]);
    if (!patient.rows[0]) throw failure('Patient not found.', 404);
    if (patient.rows[0].status !== 'active') throw failure('Approve registration before assigning a provider.', 409);
    const provider = await client.query(`SELECT d.user_id FROM doctors d JOIN users u ON u.id = d.user_id
      WHERE d.user_id = $1 AND u.role = 'doctor' FOR SHARE OF u`, [input.providerUserId]);
    if (!provider.rows[0]) throw failure('Choose an approved provider with a professional profile.', 400);
    const current = await client.query(`SELECT id FROM care_team_assignments WHERE patient_id = $1
      AND provider_user_id = $2 AND revoked_at IS NULL`, [patientId, input.providerUserId]);
    if (current.rows[0]) throw failure('Revoke the existing assignment before assigning this provider again.', 409);
    const result = await client.query(`INSERT INTO care_team_assignments
      (patient_id, provider_user_id, access_scope, assigned_by, reason, ends_at)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, patient_id, provider_user_id, access_scope, starts_at, ends_at`,
    [patientId, input.providerUserId, input.accessScope, actor._id,
      JSON.stringify(encryptValue(input.reason.trim())), input.endsAt || null]);
    await audit(client, actor, 'assign_care_provider', patientId, { assignmentId: result.rows[0].id, scope: input.accessScope });
    return result.rows[0];
  });
}

async function revokeProvider(actor, patientId, assignmentId, reason) {
  if (actor.role !== 'admin') throw failure('Administrator access required.', 403);
  return withTransaction(async (client) => {
    await client.query('SELECT id FROM patients WHERE id = $1 FOR UPDATE', [patientId]);
    const result = await client.query(`UPDATE care_team_assignments SET revoked_at = NOW(), revoked_by = $3,
      revocation_reason = $4 WHERE id = $1 AND patient_id = $2 AND revoked_at IS NULL
      RETURNING id, revoked_at`, [assignmentId, patientId, actor._id, JSON.stringify(encryptValue(reason.trim()))]);
    if (!result.rows[0]) throw failure('Assignment not found or already revoked.', 404);
    await audit(client, actor, 'revoke_care_provider', patientId, { assignmentId });
    return result.rows[0];
  });
}

async function registrationHistory(userId) {
  return withTransaction(async (client) => {
    const result = await client.query(`SELECT r.id, r.application_version, r.details, r.policy_version, r.source,
      r.submitted_at, r.recorded_at FROM registration_revisions r
      WHERE r.registration_user_id = $1 ORDER BY r.application_version DESC`, [userId]);
    await audit(client, { _id: userId, role: 'patient' }, 'view_registration_history', userId);
    return result.rows.map((row) => ({ id: row.id, version: row.application_version,
      details: decryptValue(row.details), policyVersion: row.policy_version, source: row.source,
      submittedAt: row.submitted_at, recordedAt: row.recorded_at }));
  });
}

module.exports = { listPatients, readPatient, changeReminderConsent, assignProvider, revokeProvider, registrationHistory };
