import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../integration/mindbridge-route.cjs';
import { verifyToken } from '../server/security.js';
const secret = 'a-dedicated-test-secret-for-adapter-testing';
function response() {
  return {
    code: 200,
    set() {
      return this;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}
test('adapter refuses unapproved patients and incomplete administrator MFA', async () => {
  for (const identity of [{
    id: 'u',
    role: 'patient',
    approved: false
  }, {
    id: 'a',
    role: 'admin',
    mfaVerified: false
  }]) {
    const res = response();
    await handler({
      secret,
      getAuthorizedIdentity: async () => identity
    })({}, res, e => {
      throw e;
    });
    assert.equal(res.code, 403);
  }
});
test('adapter signs approved server identity, never the submitted role', async () => {
  const res = response();
  await handler({
    secret,
    getAuthorizedIdentity: async () => ({
      id: 'p',
      role: 'patient',
      approved: true
    })
  })({
    body: {
      role: 'admin',
      id: 'other'
    }
  }, res, e => {
    throw e;
  });
  assert.deepEqual(verifyToken(res.body.token, secret), {
    id: 'p',
    role: 'patient'
  });
});
