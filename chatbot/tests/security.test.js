import test from 'node:test';
import assert from 'node:assert/strict';
import { signToken, verifyToken, vault, text, uuid } from '../server/security.js';
const secret = 'a-test-only-secret-that-is-long-enough';
const claims = {
  sub: 'test-user',
  role: 'patient',
  iss: 'mindbridge',
  aud: 'mindbridge-chatbot',
  iat: 100,
  exp: 400
};
test('integration token verifies audience, role and lifetime', () => {
  assert.deepEqual(verifyToken(signToken(claims, secret), secret, 200), {
    id: 'test-user',
    role: 'patient'
  });
});
for (const [name, change] of Object.entries({
  expired: {
    exp: 150
  },
  wrongAudience: {
    aud: 'another-app'
  },
  wrongIssuer: {
    iss: 'other'
  },
  tooLong: {
    exp: 1000
  },
  adminWithoutMfa: {
    role: 'admin'
  },
  badRole: {
    role: 'doctor'
  },
  future: {
    iat: 500,
    exp: 700
  },
  noIdentity: {
    sub: ''
  }
})) test(`rejects ${name}`, () => assert.throws(() => verifyToken(signToken({
  ...claims,
  ...change
}, secret), secret, 200)));
test('tampered signatures are rejected', () => assert.throws(() => verifyToken(signToken(claims, secret) + 'a', secret, 200)));
test('AES-GCM encrypts sensitive content and detects tampering', () => {
  const v = vault('ab'.repeat(32)),
    encrypted = v.seal({
      content: 'private message'
    });
  assert.ok(!encrypted.includes('private'));
  assert.deepEqual(v.open(encrypted), {
    content: 'private message'
  });
  const b = Buffer.from(encrypted, 'base64');
  b[30] ^= 1;
  assert.throws(() => v.open(b.toString('base64')));
});
test('request validation bounds text and rejects invalid identifiers', () => {
  assert.equal(text(' hello '), 'hello');
  assert.throws(() => text('x'.repeat(4001)));
  assert.throws(() => text({}));
  assert.throws(() => uuid('../secrets'));
});
