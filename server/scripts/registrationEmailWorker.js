const { loadEnvironment } = require('../config/environment');
loadEnvironment();
let database;
const nodemailer = require('nodemailer');
const { deliverCareNext } = require('../services/careEmailDelivery');
const { createCareService } = require('../services/careService');
const { deliverNext } = require('../services/registrationEmailDelivery');
const { validateEmailConfiguration, safeWorkerError } = require('../services/emailWorkerDiagnostics');
let stage = 'Configuration';

async function run() {
  const config = { appOrigin: process.env.APP_PUBLIC_URL, adminEmail: process.env.REGISTRATION_ADMIN_EMAIL, from: process.env.MAIL_FROM };
  const configurationError = validateEmailConfiguration(process.env);
  if (configurationError) { console.error(`[email-worker] ${configurationError}`); process.exitCode = 1; return; }
  stage = 'Database connection';
  database = require('../config/database');
  await database.query('SELECT id FROM registration_email_jobs LIMIT 0');
  await database.query('SELECT id FROM care_email_jobs LIMIT 0');
  console.log('[email-worker] Database and email queue are available.');
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_SECURE !== 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000 });
  stage = 'SMTP connection';
  await transport.verify();
  console.log('[email-worker] SMTP connection verified. No test email was sent.');
  if (process.argv.includes('--check')) { transport.close(); return; }
  stage = 'Queue processing';
  console.log('[email-worker] Running. Checking queued emails every five seconds when idle.');
  let stopping = false;
  process.on('SIGTERM', () => { stopping = true; });
  process.on('SIGINT', () => { stopping = true; });
  while (!stopping) {
    await createCareService(database).maintenance();
    const registrationDelivered = await deliverNext({ database, transport, config });
    const careDelivered = await deliverCareNext({ database, transport, config });
    const delivered = registrationDelivered || careDelivered;
    if (process.argv.includes('--once')) break;
    if (!delivered) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  transport.close();
}
run().catch((error) => { console.error(`[email-worker] ${safeWorkerError(error, stage)}`); process.exitCode = 1; })
  .finally(() => database?.closePool());
