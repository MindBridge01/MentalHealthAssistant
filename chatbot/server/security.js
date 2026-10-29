import { createHmac, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function signToken(claims, secret) {
  const header = Buffer.from(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${payload}.${createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')}`;
}
export function verifyToken(token, secret, now = Date.now() / 1000) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw Error();
    const [h, p, s] = parts;
    const expected = createHmac('sha256', secret).update(`${h}.${p}`).digest();
    const signature = Buffer.from(s, 'base64url');
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) throw Error();
    const head = JSON.parse(Buffer.from(h, 'base64url')),
      c = JSON.parse(Buffer.from(p, 'base64url'));
    if (head.alg !== 'HS256' || c.iss !== 'mindbridge' || c.aud !== 'mindbridge-chatbot' || typeof c.sub !== 'string' || !c.sub || c.sub.length > 128 || !['patient', 'admin'].includes(c.role) || !Number.isFinite(c.exp) || !Number.isFinite(c.iat) || c.exp <= now || c.iat > now + 30 || c.exp - c.iat > 300 || c.role === 'admin' && c.mfa !== true) throw Error();
    return {
      id: c.sub,
      role: c.role
    };
  } catch {
    throw new HttpError(401, 'Sign in through MindBridge again.');
  }
}
export function vault(keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  return {
    seal(value) {
      const iv = randomBytes(12),
        cipher = createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
    },
    open(value) {
      const b = Buffer.from(value, 'base64'),
        decipher = createDecipheriv('aes-256-gcm', key, b.subarray(0, 12));
      decipher.setAuthTag(b.subarray(12, 28));
      return JSON.parse(Buffer.concat([decipher.update(b.subarray(28)), decipher.final()]).toString());
    }
  };
}
export function text(value, max = 4000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new HttpError(400, `Enter text between 1 and ${max} characters.`);
  return value.trim();
}
export function uuid(value) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value || '')) throw new HttpError(400, 'Invalid identifier.');
  return value;
}
