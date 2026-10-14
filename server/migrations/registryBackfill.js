const { decryptValue, encryptValue } = require('../services/encryptionService');

// Frozen backfill for migration 003. Keep it independent of future runtime model changes.
async function captureRegistration(client, row) {
  const details = decryptValue(row.details) || {};
  const revision = await client.query(`INSERT INTO registration_revisions
    (patient_id, registration_user_id, application_version, details, policy_version, source, submitted_at)
    VALUES ($1,$2,$3,$4,$5,'migration_snapshot',$6) RETURNING id`,
  [row.patient_id, row.user_id, row.version, row.details, row.consent_version, row.submitted_at]);
  if (details.contactName && details.contactPhone) {
    await client.query(`INSERT INTO patient_contacts(patient_id, origin, details) VALUES ($1,'registration',$2)`,
      [row.patient_id, JSON.stringify(encryptValue({ name: details.contactName,
        phone: details.contactPhone, relationship: details.contactRelationship || '' }))]);
  }
  const choices = [];
  if (details.privacyAccepted === true) choices.push(['registration_processing', 'granted']);
  if (details.supportAcknowledged === true) choices.push(['service_limitations', 'acknowledged']);
  if (typeof details.emailReminders === 'boolean') choices.push(['appointment_email_reminders', details.emailReminders ? 'granted' : 'declined']);
  for (const [purpose, decision] of choices) {
    await client.query(`INSERT INTO patient_consents
      (patient_id,purpose,decision,policy_version,actor_user_id,source_revision_id) VALUES ($1,$2,$3,$4,$5,$6)`,
    [row.patient_id, purpose, decision, row.consent_version, row.user_id, revision.rows[0].id]);
  }
}

async function activatePatient(client, row) {
  const details = decryptValue(row.details) || {};
  const demographics = {};
  for (const field of ['name','preferredName','dateOfBirth','gender','phone','language','city']) {
    if (details[field] != null) demographics[field] = String(details[field]);
  }
  const clinical = {};
  for (const field of ['previousCare','careContext']) {
    if (details[field] != null) clinical[field] = details[field];
  }
  await client.query(`UPDATE patients SET status = 'active', demographics = $2, clinical_context = $3,
    version = version + 1, updated_at = NOW() WHERE id = $1`,
  [row.patient_id, JSON.stringify(encryptValue(demographics)), JSON.stringify(encryptValue(clinical))]);
}

async function backfillRegistry(client) {
  let cursor = '';
  while (true) {
    const result = await client.query(`SELECT r.*, p.birthday, p.gender, p.phone, p.city,
      p.mental_health_context, u.name FROM patient_registrations r
      JOIN users u ON u.id = r.user_id LEFT JOIN profiles p ON p.user_id = r.user_id
      WHERE r.user_id > $1 ORDER BY r.user_id LIMIT 100`, [cursor]);
    if (!result.rows.length) break;
    for (const row of result.rows) {
      // Preserve exactly the latest saved application; earlier overwritten versions cannot be reconstructed.
      await captureRegistration(client, row);
      if (row.status === 'approved') {
        if (row.consent_version === 'legacy-onboarding') {
          // Legacy approval records contain {}. Recover available demographics without manufacturing consent.
          const recovered = { name: row.name, dateOfBirth: decryptValue(row.birthday),
            gender: decryptValue(row.gender), phone: decryptValue(row.phone), city: row.city,
            careContext: decryptValue(row.mental_health_context) };
          await activatePatient(client, { ...row, details: encryptValue(recovered) });
        } else {
          await activatePatient(client, row);
        }
      }
    }
    cursor = result.rows[result.rows.length - 1].user_id;
  }
}
module.exports = { backfillRegistry };
