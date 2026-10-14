const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEmailConfiguration, safeWorkerError } = require('../services/emailWorkerDiagnostics');
test('configuration errors name settings without echoing secrets', () => {
  assert.match(validateEmailConfiguration({}), /APP_PUBLIC_URL/);
  const env = { APP_PUBLIC_URL: 'https://example.test', REGISTRATION_ADMIN_EMAIL: 'admin@example.test', MAIL_FROM: 'mail@example.test', SMTP_HOST: 'smtp.gmail.com' };
  assert.match(validateEmailConfiguration(env), /SMTP_USER, SMTP_PASSWORD/);
  env.SMTP_USER = 'sender@example.test'; env.SMTP_PASSWORD = 'private';
  assert.equal(validateEmailConfiguration(env), null);
  env.APP_PUBLIC_URL = 'private-invalid';
  assert.ok(!validateEmailConfiguration(env).includes('private'));
});
test('database and SMTP failures provide safe actionable messages', () => {
  assert.match(safeWorkerError({ code: '42P01' }, 'Database'), /migrate:postgres/);
  assert.match(safeWorkerError({ code: 'EAUTH' }, 'SMTP'), /App Password/);
  assert.ok(!safeWorkerError({ message: 'secret password', code: 'secret' }, 'SMTP').includes('secret password'));
});
