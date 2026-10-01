const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration, validateDecision } = require('../services/registrationValidation');
const valid = { name: 'Demo Patient', dateOfBirth: '2000-01-02', phone: '+94 771234567',
  language: 'English', previousCare: 'no', privacyAccepted: true, supportAcknowledged: true };
const now = new Date('2026-09-29T12:00:00Z');

test('first-time patients can apply without diagnosis, documents, or emergency contact', () => {
  const result = validateRegistration(valid, now);
  assert.deepEqual(result.errors, {});
  assert.equal(result.data.emailReminders, false);
});
test('consent requires actual booleans and unknown fields are discarded', () => {
  const result = validateRegistration({ ...valid, privacyAccepted: 'true', status: 'approved', role: 'admin' }, now);
  assert.ok(result.errors.privacyAccepted);
  assert.equal(result.data.status, undefined);
  assert.equal(result.data.role, undefined);
});
test('age boundary and impossible dates are validated', () => {
  for (const dateOfBirth of ['2008-09-30', '2027-01-01', '2000-02-30', '', 'not-a-date']) {
    assert.ok(validateRegistration({ ...valid, dateOfBirth }, now).errors.dateOfBirth);
  }
  assert.equal(validateRegistration({ ...valid, dateOfBirth: '2008-09-29' }, now).errors.dateOfBirth, undefined);
});
test('partial trusted contact, invalid phones, languages and oversized context are rejected', () => {
  const result = validateRegistration({ ...valid, contactName: 'Friend', phone: 'abc', language: 'invalid', careContext: 'x'.repeat(2001) }, now);
  for (const key of ['contactPhone', 'contactRelationship', 'phone', 'language', 'careContext']) assert.ok(result.errors[key]);
});
test('review requires a supported decision, version, and explanation for non-approval', () => {
  assert.equal(validateDecision({ status: 'approved', version: 1, note: '' }), null);
  assert.equal(validateDecision({ status: 'needs_information', version: 1, note: 'Please correct your contact number.' }), null);
  for (const decision of [{ status: 'declined', version: 1, note: '' }, { status: 'approved', version: 0, note: '' }, { status: 'admin', version: 1, note: '' }]) assert.ok(validateDecision(decision));
});
