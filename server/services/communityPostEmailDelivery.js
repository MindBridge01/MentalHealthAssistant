const { randomUUID } = require('node:crypto');
const { LOGO_PATH } = require('./emailTemplates');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

function renderCommunityPostEmail(postId, appOrigin) {
  const origin = new URL(appOrigin);
  if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error('Invalid application origin');
  }
  const dashboardUrl = new URL('/admin/content-review', origin).href;
  const reference = String(postId).slice(0, 80);
  const paragraphs = [
    'Hello,',
    'A patient community post is waiting for moderation.',
    `Submission reference: ${reference}`,
    'Sign in to the admin dashboard to review the submission. The submission text is not included in this email.',
  ];

  return {
    subject: `Community post awaiting review — ${reference}`,
    text: [...paragraphs, `Review securely: ${dashboardUrl}`, 'Please do not reply with medical information.'].join('\n\n'),
    html: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;line-height:1.6;padding:20px"><img src="cid:mindbridge-logo" alt="MindBridge" width="150"><main>${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}<p><a href="${escapeHtml(dashboardUrl)}">Review securely</a></p></main><hr><p>Please do not reply with medical information.</p></body></html>`,
    attachments: [{ filename: 'mindbridge-logo.png', path: LOGO_PATH, cid: 'mindbridge-logo', contentType: 'image/png', contentDisposition: 'inline' }],
  };
}

async function deliverCommunityPostNext({ database, transport, config }) {
  const job = await database.withTransaction(async (client) => {
    await client.query(`UPDATE community_post_email_jobs
      SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
        lease_token = NULL, locked_at = NULL
      WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '10 minutes'`);
    const row = (await client.query(`SELECT id, post_id, attempts
      FROM community_post_email_jobs
      WHERE status = 'pending' AND available_at <= NOW() AND attempts < 5
      ORDER BY available_at, id
      FOR UPDATE SKIP LOCKED LIMIT 1`)).rows[0];
    if (!row) return null;
    row.lease = randomUUID();
    await client.query(`UPDATE community_post_email_jobs
      SET status = 'processing', attempts = attempts + 1, locked_at = NOW(), lease_token = $2
      WHERE id = $1`, [row.id, row.lease]);
    return row;
  });

  if (!job) return false;
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail || '')) {
      throw new Error('invalid recipient');
    }
    const result = await transport.sendMail({
      from: config.from,
      to: config.adminEmail,
      messageId: `<community-${job.id}@${new URL(config.appOrigin).hostname}>`,
      ...renderCommunityPostEmail(job.post_id, config.appOrigin),
    });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('recipient not accepted');
    await database.query(`UPDATE community_post_email_jobs
      SET status = 'sent', sent_at = NOW(), locked_at = NULL, lease_token = NULL, last_error = NULL
      WHERE id = $1 AND lease_token = $2`, [job.id, job.lease]);
  } catch {
    const attempts = job.attempts + 1;
    await database.query(`UPDATE community_post_email_jobs
      SET status = $3, locked_at = NULL, lease_token = NULL, last_error = 'delivery_failed',
        available_at = NOW() + ($4 * INTERVAL '1 minute')
      WHERE id = $1 AND lease_token = $2`,
    [job.id, job.lease, attempts >= 5 ? 'failed' : 'pending', 2 ** attempts]);
  }
  return true;
}

module.exports = { renderCommunityPostEmail, deliverCommunityPostNext };
