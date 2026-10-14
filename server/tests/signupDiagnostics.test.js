const test = require('node:test');
const assert = require('node:assert/strict');
const { signupFailure } = require('../services/signupDiagnostics');
test('signup diagnostics classify schema and duplicate errors without leaking details', () => {
  assert.equal(signupFailure({ code: '23505' }).status, 409);
  assert.match(signupFailure({ code: '22P02' }).diagnostic, /type_mismatch/);
  assert.match(signupFailure({ code: '42703' }).diagnostic, /missing_database_column/);
  const result = signupFailure({ code: 'unexpected-secret', message: 'password secret', detail: 'private email' });
  assert.equal(result.status, 500);
  assert.ok(!JSON.stringify(result).includes('secret'));
  assert.ok(!JSON.stringify(result).includes('private'));
});
