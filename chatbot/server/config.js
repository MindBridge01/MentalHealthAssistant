export function config(env = process.env) {
  const demo = env.CHATBOT_DEMO === 'true';
  if (!demo && (!env.CHATBOT_DATABASE_URL || !/^[a-f0-9]{64}$/i.test(env.CHATBOT_DATA_KEY || '') || (env.CHATBOT_AUTH_SECRET || '').length < 32)) {
    throw Object.assign(new Error('Set CHATBOT_DATABASE_URL, CHATBOT_DATA_KEY (64 hex characters), and CHATBOT_AUTH_SECRET (at least 32 characters) in the backend server/.env or process environment.'), {code:'CHATBOT_CONFIG'});
  }
  const origin = env.CHATBOT_PUBLIC_ORIGIN || 'http://localhost:5180';
  if (!demo && env.NODE_ENV === 'production' && !origin.startsWith('https://')) throw new Error('Production requires an HTTPS public origin.');
  return {
    demo,
    production: env.NODE_ENV === 'production',
    port: Number(env.CHATBOT_PORT || 3100),
    origin,
    databaseUrl: env.CHATBOT_DATABASE_URL,
    dataKey: env.CHATBOT_DATA_KEY,
    authSecret: env.CHATBOT_AUTH_SECRET,
    geminiApiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || 'gemini-2.5-flash',
    models: env.MODEL_SERVICE_URL || 'http://127.0.0.1:8100',
    host: env.CHATBOT_HOST || '127.0.0.1',
    retentionDays: 30
  };
}
