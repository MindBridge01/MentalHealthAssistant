const crypto = require('node:crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function bufferToBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32ToBuffer(base32) {
  const clean = String(base32 || '').toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateMfaSecret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  return bufferToBase32(bytes);
}

function generateTotp(secret, timeMs = Date.now(), stepSeconds = 30) {
  const key = typeof secret === 'string' ? base32ToBuffer(secret) : secret;
  const counter = Math.floor(timeMs / 1000 / stepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binaryCode % 1000000;
  return String(otp).padStart(6, '0');
}

function verifyTotp(inputCode, secret, { window = 1, timeMs = Date.now(), stepSeconds = 30 } = {}) {
  const cleanCode = String(inputCode || '').replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanCode) || !secret) {
    return false;
  }

  try {
    for (let i = -window; i <= window; i++) {
      const checkTime = timeMs + i * stepSeconds * 1000;
      const expected = generateTotp(secret, checkTime, stepSeconds);
      if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

function getOtpAuthUrl({ issuer = 'MindBridge', accountName, secret }) {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  generateMfaSecret,
  generateTotp,
  verifyTotp,
  getOtpAuthUrl,
  bufferToBase32,
  base32ToBuffer,
};
