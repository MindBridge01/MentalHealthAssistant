const { encryptValue, decryptValue } = require('./encryptionService');

function splitRegistration(details) {
  const demographics = {};
  for (const key of ['name', 'preferredName', 'dateOfBirth', 'gender', 'phone', 'language', 'city']) {
    if (details[key] !== undefined) demographics[key] = details[key];
  }
  const clinicalContext = {};
  for (const key of ['previousCare', 'careContext']) {
    if (details[key] !== undefined) clinicalContext[key] = details[key];
  }
  return { demographics, clinicalContext };
}

async function captureRegistration(client, row, source = 'submission') {
  const details = decryptValue(row.details) || {};
  const revision = await client.query(`INSERT INTO registration_revisions
    (patient_id, registration_user_id, application_version, details, policy_version, source, submitted_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
  [row.patient_id, row.user_id, row.version, row.details, row.consent_version, source, row.submitted_at]);

  if (details.contactName && details.contactPhone) {
    await client.query(`INSERT INTO patient_contacts(patient_id, origin, details)
      VALUES ($1,'registration',$2)
      ON CONFLICT(patient_id, origin) DO UPDATE SET details = EXCLUDED.details,
      archived_at = NULL, verified_at = NULL, updated_at = NOW()`,
    [row.patient_id, JSON.stringify(encryptValue({ name: details.contactName,
      phone: details.contactPhone, relationship: details.contactRelationship || '' }))]);
  } else if (source === 'submission') {
    await client.query(`UPDATE patient_contacts SET archived_at = NOW(), updated_at = NOW()
      WHERE patient_id = $1 AND origin = 'registration' AND archived_at IS NULL`, [row.patient_id]);
  }

  // Never invent permissions for old applications that did not record these choices.
  const decisions = [];
  if (details.privacyAccepted === true) decisions.push(['registration_processing', 'granted']);
  if (details.supportAcknowledged === true) decisions.push(['service_limitations', 'acknowledged']);
  if (typeof details.emailReminders === 'boolean') {
    decisions.push(['appointment_email_reminders', details.emailReminders ? 'granted' : 'declined']);
  }
  for (const [purpose, decision] of decisions) {
    await client.query(`INSERT INTO patient_consents
      (patient_id, purpose, decision, policy_version, actor_user_id, source_revision_id)
      VALUES ($1,$2,$3,$4,$5,$6)`,
    [row.patient_id, purpose, decision, row.consent_version, row.user_id, revision.rows[0].id]);
  }
}

async function activatePatient(client, row) {
  const { demographics, clinicalContext } = splitRegistration(decryptValue(row.details) || {});
  await client.query(`UPDATE patients SET status = 'active', demographics = $2,
    clinical_context = $3, version = version + 1, updated_at = NOW() WHERE id = $1`,
  [row.patient_id, JSON.stringify(encryptValue(demographics)), JSON.stringify(encryptValue(clinicalContext))]);
}

module.exports = { splitRegistration, captureRegistration, activatePatient };
