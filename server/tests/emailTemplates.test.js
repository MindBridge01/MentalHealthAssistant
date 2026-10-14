const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderEmail, TEMPLATES, LOGO_PATH } = require('../services/emailTemplates');
const { queueRegistrationEmail } = require('../services/registrationNotifications');
const { deliverNext } = require('../services/registrationEmailDelivery');
test('all email templates include logo, safe links and plain text', () => {
  assert.ok(fs.existsSync(LOGO_PATH));
  for (const name of Object.keys(TEMPLATES)) {
    const email = renderEmail(name, { appOrigin: 'https://mindbridge.example', firstName: '<script>alert(1)</script>' });
    assert.ok(email.subject && email.text);
    assert.ok(email.html.includes('cid:mindbridge-logo'));
    assert.ok(!email.html.includes('<script>'));
    assert.ok(email.html.includes('https://mindbridge.example/'));
    assert.equal(email.attachments[0].path, LOGO_PATH);
  }
  assert.throws(() => renderEmail('missing', { appOrigin: 'https://example.test' }));
  assert.throws(() => renderEmail('patient_received', { appOrigin: 'javascript:alert(1)' }));
});
test('submission queues admin and patient receipt; decisions queue patient only', async () => {
  const calls = [];
  const client = { query: async (_sql, params) => calls.push(params) };
  await queueRegistrationEmail(client, { user_id: 'patient', version: 1, status: 'submitted' });
  assert.deepEqual(calls.map((p) => p[2]), ['admin', 'patient']);
  calls.length = 0;
  await queueRegistrationEmail(client, { user_id: 'patient', version: 2, status: 'approved' });
  assert.deepEqual(calls.map((p) => p[2]), ['patient']);
});
test('worker records SMTP acceptance or schedules a retry without exposing SMTP errors', async () => {
  for (const fails of [false, true]) {
    const calls = [];
    const database = { query: async (sql, params) => {
      calls.push([sql, params]);
      return { rows: sql.includes('SELECT j.*') ? [{ id: 'abc12345', audience: 'patient', event: 'approved', email: 'person@example.test', attempts: 0 }] : [] };
    }, withTransaction: async (fn) => fn(database) };
    const transport = { sendMail: async (email) => { assert.equal(email.attachments[0].cid, 'mindbridge-logo'); if (fails) throw new Error('secret SMTP details'); return { accepted: ['person@example.test'] }; } };
    assert.equal(await deliverNext({ database, transport, config: { appOrigin: 'https://example.test', from: 'mail@example.test' } }), true);
    assert.ok(calls.at(-1)[0].includes(fails ? "last_error = 'delivery_failed'" : "status = 'sent'"));
    assert.ok(!JSON.stringify(calls).includes('secret SMTP details'));
  }
});
