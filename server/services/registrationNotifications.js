// Called inside the same transaction as the application change. No SMTP in requests.
async function queueRegistrationEmail(client, row) {
  const audiences = row.status === 'submitted' ? ['admin', 'patient'] : ['patient'];
  for (const audience of audiences) {
  await client.query(`INSERT INTO registration_email_jobs
    (registration_user_id, application_version, audience, event)
    VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
  [row.user_id, row.version, audience, row.status]);
  }
}
module.exports = { queueRegistrationEmail };
