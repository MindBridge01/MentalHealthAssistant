const { randomUUID } = require('node:crypto');
const { renderEmail } = require('./emailTemplates');

function emailMessage(job, appOrigin) {
  const kind = job.application_kind === 'professional' ? 'professional' : 'patient';
  const template = job.audience === 'admin' ? `${kind}_submitted_admin` : job.event === 'submitted' ? `${kind}_received` : `${kind}_${job.event}`;
  return renderEmail(template, { appOrigin });
}

async function deliverNext({ database, transport, config }) {
  // Lease recovery makes restarts safe. Token fencing prevents stale workers changing a reclaimed job.
  const job = await database.withTransaction(async (client) => {
    await client.query(`UPDATE registration_email_jobs SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
      lease_token = NULL, locked_at = NULL WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '10 minutes'`);
    const result = await client.query(`SELECT j.*, u.email FROM registration_email_jobs j
      JOIN users u ON u.id = j.registration_user_id
      WHERE j.status = 'pending' AND j.available_at <= NOW() AND j.attempts < 5
      ORDER BY j.available_at, j.id FOR UPDATE OF j SKIP LOCKED LIMIT 1`);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    row.lease = randomUUID();
    await client.query(`UPDATE registration_email_jobs SET status = 'processing', attempts = attempts + 1,
      locked_at = NOW(), lease_token = $2 WHERE id = $1`, [row.id, row.lease]);
    return row;
  });
  if (!job) return false;
  try {
    const to = job.audience === 'admin' ? config.adminEmail : job.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to || '')) throw new Error('invalid recipient');
    const result = await transport.sendMail({ from: config.from, to,
      messageId: `<registration-${job.id}@${new URL(config.appOrigin).hostname}>`,
      ...emailMessage(job, config.appOrigin) });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('recipient not accepted');
    await database.query(`UPDATE registration_email_jobs SET status = 'sent', sent_at = NOW(),
      locked_at = NULL, lease_token = NULL, last_error = NULL WHERE id = $1 AND lease_token = $2`, [job.id, job.lease]);
  } catch {
    // SMTP errors may contain credentials or recipients; keep only a non-sensitive failure code.
    const attempts = job.attempts + 1;
    await database.query(`UPDATE registration_email_jobs SET status = $3, locked_at = NULL, lease_token = NULL,
      last_error = 'delivery_failed', available_at = NOW() + ($4 * INTERVAL '1 minute')
      WHERE id = $1 AND lease_token = $2`, [job.id, job.lease, attempts >= 5 ? 'failed' : 'pending', 2 ** attempts]);
  }
  return true;
}
module.exports = { deliverNext, emailMessage };
