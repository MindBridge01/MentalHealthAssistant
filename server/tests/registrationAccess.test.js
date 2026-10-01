const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load just the module under test with injected boundaries. Never load database/environment configuration.
function isolatedModule(relativePath, mocks) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), {
    module, exports: module.exports,
    require: (id) => {
      if (!(id in mocks)) throw new Error(`Unexpected dependency: ${id}`);
      return mocks[id];
    },
  });
  return module.exports;
}

test('pending, declined and unsubmitted patients cannot access gated endpoints', async () => {
  for (const status of ['not_submitted', 'submitted', 'needs_information', 'declined']) {
    const { requireApprovedPatient } = isolatedModule('../middleware/registrationMiddleware.js', {
      '../models/registrationModel': { getRegistrationStatus: async () => status },
    });
    let code; let advanced = false;
    const res = { status(value) { code = value; return this; }, json() {} };
    await requireApprovedPatient({ user: { _id: 'patient-a', role: 'patient' } }, res, () => { advanced = true; });
    assert.equal(code, 403); assert.equal(advanced, false);
  }
});
test('approval allows access and database failures fail closed', async () => {
  for (const fail of [false, true]) {
    let checkedUser; let code; let advanced = false;
    const { requireApprovedPatient } = isolatedModule('../middleware/registrationMiddleware.js', {
      '../models/registrationModel': { getRegistrationStatus: async (id) => { checkedUser = id; if (fail) throw new Error('offline'); return 'approved'; } },
    });
    await requireApprovedPatient({ user: { _id: 'patient-a', role: 'patient' } }, {
      status(value) { code = value; return this; }, json() {},
    }, () => { advanced = true; });
    assert.equal(checkedUser, 'patient-a'); assert.equal(advanced, !fail);
    if (fail) assert.equal(code, 503);
  }
});
test('admin application list excludes health context and trusted contacts', async () => {
  const row = { user_id: 'patient-a', details: { name: 'Demo Patient', careContext: 'private', previousCare: 'yes',
    contactName: 'Private contact', contactPhone: '123456789', contactRelationship: 'Friend' }, status: 'submitted', version: 1 };
  const model = isolatedModule('../models/registrationModel.js', {
    '../config/database': { query: async () => ({ rows: [row] }), withTransaction: () => {} },
    '../services/encryptionService': { encryptValue: (value) => value, decryptValue: (value) => ({ ...value }) },
  });
  const [application] = await model.listApplications();
  assert.equal(application.details.name, 'Demo Patient');
  for (const field of ['careContext', 'previousCare', 'contactName', 'contactPhone', 'contactRelationship']) assert.equal(application.details[field], undefined);
  assert.equal((await model.getApplication('patient-a')).details.careContext, 'private');
});
test('stale admin reviews and duplicate submissions return conflict without creating events', async () => {
  let calls = 0;
  const model = isolatedModule('../models/registrationModel.js', {
    '../config/database': { query: () => {}, withTransaction: async (fn) => fn({ query: async () => { calls++; return { rows: [] }; } }) },
    '../services/encryptionService': { encryptValue: (value) => value, decryptValue: (value) => value },
  });
  assert.equal(await model.submitApplication('patient-a', { name: 'Demo Patient' }), null);
  assert.equal(calls, 1);
  assert.equal(await model.reviewApplication('patient-a', 'admin-a', { status: 'approved', note: '', version: 1 }), null);
  assert.equal(calls, 2);
});
