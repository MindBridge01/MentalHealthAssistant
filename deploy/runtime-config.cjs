const fs = require('node:fs');
function runtimeConfig(input = process.env) {
  const env = {...input};
  if (env.CHATBOT_SERVICE_HOSTPORT) env.CHATBOT_SERVICE_URL = `http://${env.CHATBOT_SERVICE_HOSTPORT}`;
  if (env.MODEL_SERVICE_HOSTPORT) env.MODEL_SERVICE_URL = `http://${env.MODEL_SERVICE_HOSTPORT}`;
  if (env.DATABASE_CA_PEM) {
    const filename = '/tmp/mindbridge-db-ca.pem';
    fs.writeFileSync(filename, env.DATABASE_CA_PEM, {mode: 0o600});
    env.POSTGRES_CA_CERT = env.CHATBOT_CA_CERT = filename;
    // pg connection-string SSL options otherwise override the trusted CA object.
    for (const key of ['DATABASE_URL', 'CHATBOT_DATABASE_URL']) {
      if (!env[key]) continue;
      const url = new URL(env[key]);
      for (const option of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(option);
      env[key] = url.toString();
    }
  } else if (env.CHATBOT_DATABASE_URL) {
    const url = new URL(env.CHATBOT_DATABASE_URL);
    url.searchParams.set('sslmode', 'verify-full');
    env.CHATBOT_DATABASE_URL = url.toString();
  }
  if (env.SERVE_WEB === 'true') {
    if (!env.APP_PUBLIC_URL?.startsWith('https://')) throw Error('APP_PUBLIC_URL must be the HTTPS website origin.');
    const publicConfig = JSON.stringify({googleClientId: env.GOOGLE_CLIENT_ID || '', release: env.APP_RELEASE_SHA || ''}).replaceAll('<', '\\u003c');
    fs.writeFileSync('/app/dist/config.js', `window.__MINDBRIDGE_CONFIG__ = ${publicConfig};\n`);
  }
  return env;
}
module.exports = {runtimeConfig};
