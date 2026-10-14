function validateEmailConfiguration(env) {
  const required = ['APP_PUBLIC_URL', 'REGISTRATION_ADMIN_EMAIL', 'MAIL_FROM', 'SMTP_HOST'];
  if (env.SMTP_HOST === 'smtp.gmail.com' || env.SMTP_USER) required.push('SMTP_USER', 'SMTP_PASSWORD');
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) return `Missing settings in server/.env: ${missing.join(', ')}.`;
  try {
    const url = new URL(env.APP_PUBLIC_URL);
    if (url.username || url.password || !['http:', 'https:'].includes(url.protocol) ||
        (env.NODE_ENV === 'production' && url.protocol !== 'https:')) return 'APP_PUBLIC_URL must be a valid website URL (HTTPS in production).';
  } catch { return 'APP_PUBLIC_URL must be a valid website URL.'; }
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return 'SMTP_PORT must be a valid port number.';
  if (env.SMTP_SECURE && !['true', 'false'].includes(env.SMTP_SECURE)) return 'SMTP_SECURE must be true or false.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.REGISTRATION_ADMIN_EMAIL)) return 'REGISTRATION_ADMIN_EMAIL must contain one valid email address.';
  return null;
}
function safeWorkerError(error, stage) {
  const codes = {
    '42P01': 'Email queue table is missing. Run: npm --prefix server run migrate:postgres',
    '42703': 'Database schema is out of date. Run the pending migrations.',
    '28P01': 'Database authentication failed. Check your database credentials privately.',
    '3D000': 'The configured database does not exist.',
    '42501': 'The database account does not have the required permissions.',
    EAUTH: 'SMTP authentication failed. For Gmail, check SMTP_USER and its Google App Password.',
    ECONNREFUSED: 'Connection refused. Check the configured host, port and network access.',
    ENOTFOUND: 'Host name could not be resolved. Check the host setting and DNS.',
    ETIMEDOUT: 'Connection timed out. Check network/firewall access.',
    ESOCKET: 'SMTP socket/TLS connection failed. Check SMTP_HOST, port and TLS settings.',
    SELF_SIGNED_CERT_IN_CHAIN: 'TLS certificate verification failed. Configure the trusted certificate chain.',
  };
  return `${stage}: ${codes[error?.code] || 'Operation failed. Check configuration and service availability; sensitive error details were suppressed.'}`;
}
module.exports = { validateEmailConfiguration, safeWorkerError };
