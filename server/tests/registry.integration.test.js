// node --test tests/registry.integration.test.js
// Requires @electric-sql/pglite, or set REGISTRY_TEST_PGLITE to a disposable installation's module directory.
// This suite deliberately never imports config/database or reads application environment files.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const { PGlite } = require(process.env.REGISTRY_TEST_PGLITE || '@electric-sql/pglite');
process.env.PHI_ENCRYPTION_KEY = randomBytes(32).toString('hex');
const cryptoService = require('../services/encryptionService');
const { runMigrations } = require('../migrations/migrationRunner');
const { backfillRegistry } = require('../migrations/registryBackfill');
const persistence = require('../services/registryPersistence');
const { validateAssignment, pagination } = require('../services/registryValidation');

function loadModel(filename, database) {
  const file = path.join(__dirname, '../models', filename);
  const nativeRequire = createRequire(file);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { module, exports: module.exports, Buffer,
    require: (id) => id === '../config/database' ? database : nativeRequire(id) });
  return module.exports;
}
function adapter(db) {
  return {
    async query(sql, params = []) {
      // PGlite has gen_random_uuid built in, but does not package the pgcrypto extension.
      const compatible = sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', '');
      if (params.length) return db.query(compatible, params);
      const results = await db.exec(compatible);
      return results[results.length - 1] || { rows: [] };
    },
    withTransaction: (fn) => db.transaction((tx) => fn(adapter(tx))),
  };
}
const details = { name: 'Fictional Patient', dateOfBirth: '2000-01-02', phone: '+94 771234567',
  language: 'English', previousCare: 'no', careContext: 'Private synthetic context',
  contactName: 'Fictional Contact', contactPhone: '+94 771234568', contactRelationship: 'Friend',
  privacyAccepted: true, supportAcknowledged: true, emailReminders: true };

test('registry migrations and workflows against embedded PostgreSQL', async (t) => {
  const db = new PGlite();
  const database = adapter(db);
  const registration = loadModel('registrationModel.js', database);
  const registry = loadModel('registryModel.js', database);
  t.after(() => db.close());
  const migrate = () => database.withTransaction((client) => runMigrations(client, backfillRegistry));
  await t.test('fresh install and repeat migration', async () => {
    assert.equal((await migrate()).length, 9);
    assert.equal((await migrate()).length, 0);
    const tables = await database.query(`SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('patients','patient_contacts','registration_revisions','patient_consents','care_team_assignments')`);
    assert.equal(tables.rows.length, 5);
    const recorded = (await database.query("SELECT checksum FROM schema_migrations WHERE id = '003_patient_registry'")).rows[0].checksum;
    await database.query("UPDATE schema_migrations SET checksum = 'changed' WHERE id = '003_patient_registry'");
    await assert.rejects(migrate(), /Applied migration changed/);
    await database.query("UPDATE schema_migrations SET checksum = $1 WHERE id = '003_patient_registry'", [recorded]);
  });
  for (const [id, role] of [['alice','patient'], ['bob','patient'], ['admin','admin'], ['doc','doctor'], ['doc2','doctor']]) {
    await database.query('INSERT INTO users(id,email,name,role) VALUES ($1,$2,$3,$4)', [id, `${id}@example.test`, id, role]);
  }
  await database.query("INSERT INTO doctors(user_id,name) VALUES ('doc','Fictional Doctor'),('doc2','Other Doctor')");
  let submitted;
  await t.test('submission atomically records encrypted revision, patient, contact and choices', async () => {
    submitted = await registration.submitApplication('alice', details);
    assert.equal(submitted.status, 'submitted');
    assert.ok(submitted.patientId);
    const stored = await database.query('SELECT * FROM registration_revisions');
    assert.equal(stored.rows.length, 1);
    assert.equal(stored.rows[0].details.__enc, true);
    assert.equal(cryptoService.decryptValue(stored.rows[0].details).careContext, details.careContext);
    assert.equal((await database.query('SELECT * FROM patient_consents')).rows.length, 3);
    assert.equal((await database.query('SELECT * FROM patient_contacts')).rows[0].details.__enc, true);
    assert.equal(await registration.submitApplication('alice', details), null);
    const emails = await database.query('SELECT * FROM registration_email_jobs');
    assert.equal(emails.rows.length, 2);
    assert.deepEqual(emails.rows.map((row) => row.audience).sort(), ['admin', 'patient']);
    assert.equal((await database.query('SELECT * FROM registration_revisions')).rows.length, 1);
  });
  await t.test('request/resubmit preserves original version and stale review fails', async () => {
    await registration.reviewApplication('alice', 'admin', { status: 'needs_information', version: submitted.version, note: 'Please correct the contact details.' });
    submitted = await registration.submitApplication('alice', { ...details, name: 'Corrected Name', contactName: '', contactPhone: '', contactRelationship: '', emailReminders: false });
    const revisions = await registry.registrationHistory('alice');
    assert.equal(revisions.length, 2);
    assert.equal(revisions[1].details.name, 'Fictional Patient');
    assert.equal(revisions[0].details.name, 'Corrected Name');
    assert.equal((await database.query('SELECT archived_at FROM patient_contacts')).rows[0].archived_at !== null, true);
    assert.equal(await registration.reviewApplication('alice', 'admin', { status: 'approved', version: 1, note: '' }), null);
    assert.equal((await database.query('SELECT status FROM patients WHERE user_id = $1', ['alice'])).rows[0].status, 'pending');
  });
  await t.test('approval creates authoritative demographics and protects sensitive fields', async () => {
    await registration.reviewApplication('alice', 'admin', { status: 'approved', version: submitted.version, note: '' });
    const own = await registry.readPatient({ _id: 'alice', role: 'patient' });
    assert.equal(own.demographics.name, 'Corrected Name');
    assert.equal(own.status, 'active');
    const history = await registration.applicationHistory('alice');
    assert.equal(history.length, 4);
    assert.equal(history[0].status, 'approved');
    assert.equal(history[0].actor, 'admin');
    assert.ok(history.some((event) => event.note === 'Please correct the contact details.'));
    assert.ok(!JSON.stringify(history).includes(details.careContext));
    assert.equal(own.clinicalContext.careContext, details.careContext);
    assert.equal(own.consentChoices.find((entry) => entry.purpose === 'appointment_email_reminders').decision, 'declined');
    const admin = await registry.readPatient({ _id: 'admin', role: 'admin' }, submitted.patientId);
    assert.equal(admin.clinicalContext, undefined);
    assert.equal(admin.contacts, undefined);
    await assert.rejects(registry.readPatient({ _id: 'bob', role: 'patient' }, submitted.patientId), { status: 404 });
    await assert.rejects(registry.readPatient({ _id: 'doc', role: 'doctor' }, submitted.patientId), { status: 404 });
  });
  await t.test('scoped assignments and revocation control actual record access', async () => {
    const admin = { _id: 'admin', role: 'admin' };
    const doctor = { _id: 'doc', role: 'doctor' };
    const input = { providerUserId: 'doc', accessScope: 'demographics', reason: 'Assigned for a scheduled consultation.' };
    const assignment = await registry.assignProvider(admin, submitted.patientId, input);
    await assert.rejects(registry.assignProvider(admin, submitted.patientId, input), { status: 409 });
    assert.equal((await registry.readPatient(doctor, submitted.patientId)).clinicalContext, undefined);
    assert.equal((await registry.listPatients(doctor, { limit: 25, offset: 0 })).patients.length, 1);
    await registry.revokeProvider(admin, submitted.patientId, assignment.id, 'Consultation relationship has ended.');
    await assert.rejects(registry.readPatient(doctor, submitted.patientId), { status: 404 });
    const clinical = await registry.assignProvider(admin, submitted.patientId, { ...input, accessScope: 'clinical_context' });
    assert.equal((await registry.readPatient(doctor, submitted.patientId)).clinicalContext.careContext, details.careContext);
    // An expired assignment cannot authorize access, even if it has not been revoked.
    await database.query("UPDATE care_team_assignments SET starts_at = NOW() - INTERVAL '2 days', ends_at = NOW() - INTERVAL '1 day' WHERE id = $1", [clinical.id]);
    await assert.rejects(registry.readPatient(doctor, submitted.patientId), { status: 404 });
    assert.equal((await registry.listPatients(doctor, { limit: 25, offset: 0 })).patients.length, 0);
    await registry.assignProvider(admin, submitted.patientId, { ...input, providerUserId: 'doc2', accessScope: 'clinical_context' });
    await database.query("UPDATE users SET role = 'patient' WHERE id = 'doc2'");
    await assert.rejects(registry.readPatient({ _id: 'doc2', role: 'doctor' }, submitted.patientId), { status: 404 });
    assert.equal((await registry.readPatient(admin, submitted.patientId)).careTeam.length, 3);
    assert.equal((await registry.readPatient({ _id: 'alice', role: 'patient' })).careTeam.length, 0);
  });
  await t.test('withdrawal creates history and does not rewrite original consent', async () => {
    await registry.changeReminderConsent({ _id: 'alice', role: 'patient' }, true);
    await registry.changeReminderConsent({ _id: 'alice', role: 'patient' }, false);
    const own = await registry.readPatient({ _id: 'alice', role: 'patient' });
    assert.equal(own.consentChoices.find((entry) => entry.purpose === 'appointment_email_reminders').decision, 'withdrawn');
    assert.equal((await database.query("SELECT * FROM patient_consents WHERE purpose = 'appointment_email_reminders'")).rows.length, 4);
    await assert.rejects(database.query("UPDATE patient_consents SET decision = 'granted'"), /append-only/);
    await assert.rejects(database.query('DELETE FROM registration_revisions'), /append-only/);
    await assert.rejects(database.query("DELETE FROM users WHERE id = 'alice'"), /foreign key/);
  });
  await t.test('failed snapshot capture rolls back the whole submission', async () => {
    const nativeCapture = persistence.captureRegistration;
    persistence.captureRegistration = async () => { throw new Error('simulated persistence failure'); };
    try {
      const failingRegistration = loadModel('registrationModel.js', database);
      await assert.rejects(failingRegistration.submitApplication('bob', details), /simulated persistence failure/);
      assert.equal((await database.query("SELECT * FROM patient_registrations WHERE user_id = 'bob'")).rows.length, 0);
      assert.equal((await database.query("SELECT * FROM patients WHERE user_id = 'bob'")).rows.length, 0);
    } finally { persistence.captureRegistration = nativeCapture; }
  });
  await t.test('input validation rejects unknown scopes and invalid pagination', () => {
    assert.ok(validateAssignment({ providerUserId: 'doc', accessScope: 'all', reason: 'Example reason for assignment.' }));
    assert.ok(validateAssignment({ providerUserId: 'doc', accessScope: 'demographics', reason: 'Example reason for assignment.', endsAt: '2020-01-01T00:00:00Z' }));
    assert.equal(pagination({ limit: '101' }), null);
    assert.equal(pagination({ offset: '-1' }), null);
  });
  await t.test('reports are encrypted, owner-only, quota-limited and removable', async () => {
    const reports = loadModel('registrationDocumentModel.js', database);
    const file = { originalname: 'private-report.pdf', buffer: Buffer.from('%PDF-1.4 synthetic report') };
    const first = await reports.addDocument('alice', file, 'application/pdf');
    const stored = (await database.query('SELECT content,metadata FROM registration_documents WHERE id=$1', [first.id])).rows[0];
    assert.equal(stored.content.__enc, true);
    assert.equal(stored.metadata.__enc, true);
    assert.equal(await reports.readDocument('bob', first.id), null);
    assert.equal(await reports.removeDocument('bob', first.id), false);
    assert.equal((await reports.readDocument('alice', first.id)).buffer.toString(), file.buffer.toString());
    await reports.addDocument('alice', file, 'application/pdf');
    await reports.addDocument('alice', file, 'application/pdf');
    await assert.rejects(reports.addDocument('alice', file, 'application/pdf'), { status: 409 });
    assert.equal((await reports.listDocuments('alice')).length, 3);
    assert.equal(await reports.removeDocument('alice', first.id), true);
    assert.equal(await reports.readDocument('alice', first.id), null);
    assert.equal((await reports.listDocuments('alice')).length, 2);
  });
});

test('existing installation backfills without inventing prior revisions or consent', async (t) => {
  const db = new PGlite(); const database = adapter(db); t.after(() => db.close());
  for (const name of ['init_schema.sql', 'patient_registration.sql']) {
    await database.query(fs.readFileSync(path.join(__dirname, '../migrations', name), 'utf8'));
  }
  await database.query("INSERT INTO users(id,email,name) VALUES ('legacy','legacy@example.test','Legacy Patient')");
  await database.query("INSERT INTO profiles(user_id,phone,onboarding_completed) VALUES ('legacy',$1,TRUE)", [JSON.stringify(cryptoService.encryptValue('123456789'))]);
  await database.query("INSERT INTO patient_registrations(user_id,details,status,consent_version) VALUES ('legacy','{}','approved','legacy-onboarding')");
  await assert.rejects(database.withTransaction((client) => runMigrations(client, async (connection) => {
    await backfillRegistry(connection);
    throw new Error('simulated migration failure');
  })), /simulated migration failure/);
  assert.equal((await database.query("SELECT to_regclass('public.patients') AS patients")).rows[0].patients, null);
  assert.equal((await database.query("SELECT to_regclass('public.schema_migrations') AS ledger")).rows[0].ledger, null);
  assert.equal((await database.query('SELECT * FROM patient_registrations')).rows.length, 1);
  const applied = await database.withTransaction((client) => runMigrations(client, backfillRegistry));
  assert.equal(applied.filter((item) => item.adopted).length, 2);
  assert.equal((await database.query('SELECT * FROM registration_revisions')).rows[0].source, 'migration_snapshot');
  assert.equal((await database.query('SELECT * FROM patient_consents')).rows.length, 0);
  const registry = loadModel('registryModel.js', database);
  const own = await registry.readPatient({ _id: 'legacy', role: 'patient' });
  assert.equal(own.demographics.phone, '123456789');
  assert.equal(own.demographics.name, 'Legacy Patient');
  assert.equal(own.status, 'active');
  assert.equal((await database.withTransaction((client) => runMigrations(client, backfillRegistry))).length, 0);
});


test('professional registration: private credentials, versioned decisions and transactional emails', async t => {
 const db=new PGlite();t.after(()=>db.close());const database=adapter(db);
 await database.withTransaction(c=>runMigrations(c,backfillRegistry));
 for(const [id,role] of [['professional','pending-doctor'],['reviewer','admin'],['stranger','pending-doctor']]) await database.query('INSERT INTO users(id,email,role,name) VALUES($1,$2,$3,$1)',[id,id+'@example.test',role]);
 const model=loadModel('professionalRegistrationModel.js',database);
 const data={name:'Test Professional',phone:'0771234567',profession:'doctor',country:'Sri Lanka',regulator:'Test authority',licenseNumber:'TEST-123',specialty:'Psychiatry',qualification:'Test degree',institution:'Test university',practiceLocation:'Test clinic',languages:'English',consent:true,version:0};
 await assert.rejects(model.submit('professional',data),/Upload/);
 const file={buffer:Buffer.from('%PDF-synthetic'),originalname:'private.pdf'};
 for(const kind of ['registration','degree']) await model.upload('professional',kind,file,'application/pdf');
 const doc=(await model.get('professional')).documents[0];
 await assert.rejects(model.download('stranger',doc.id,'stranger','pending-doctor'),/not found/);
 assert.equal((await database.query('SELECT content FROM professional_documents')).rows[0].content.__enc,true);
 const failing=loadModel('professionalRegistrationModel.js',{
   ...database,withTransaction:fn=>database.withTransaction(client=>fn({query:(sql,params)=>{
     if(sql.includes('INSERT INTO registration_email_jobs')) throw Error('simulated queue failure');
     return client.query(sql,params);
   }}))
 });
 await assert.rejects(failing.submit('professional',data),/simulated queue failure/);
 assert.equal((await model.get('professional')).status,'draft');
 assert.equal((await model.history('professional')).length,0);
 let app=await model.submit('professional',data);assert.equal(app.status,'submitted');
 assert.equal((await database.query("SELECT * FROM registration_email_jobs WHERE application_kind='professional'")).rows.length,2);
 await assert.rejects(model.upload('professional','degree',file,'application/pdf'),/cannot change/);
 await assert.rejects(model.review('professional','reviewer',{status:'approved',version:1,note:'Verified with issuing authority'}),/Verify/);
 await model.review('professional','reviewer',{status:'needs_information',version:1,note:'Please clarify the registration authority.'});
 app=await model.submit('professional',{...data,version:2});
 await assert.rejects(model.review('professional','reviewer',{status:'approved',version:1,note:'Verified credentials with authority.',verified:true}),/changed/);
 await model.review('professional','reviewer',{status:'approved',version:app.version,note:'Verified credentials with issuing authority.',verified:true});
 assert.equal((await database.query("SELECT role FROM users WHERE id='professional'")).rows[0].role,'doctor');
 assert.equal((await model.history('professional')).length,4);
 assert.equal((await database.query('SELECT * FROM registration_email_jobs')).rows.length,6);
 const {emailMessage}=require('../services/registrationEmailDelivery');
 assert.match(emailMessage({application_kind:'professional',audience:'admin',event:'submitted'},'https://example.test').subject,/professional/i);
});


test('administrator bootstrap and dashboard use real counts and keep secrets out of lists',async t=>{
 const db=new PGlite();t.after(()=>db.close());const database=adapter(db);
 await database.withTransaction(c=>runMigrations(c,backfillRegistry));
 const {bootstrapAdmin}=require('../services/adminBootstrap');
 const bcrypt=require('bcrypt');
 await assert.rejects(bootstrapAdmin(database,bcrypt.hash,{email:'admin@example.test',password:'short'}),/at least/);
 const id=await bootstrapAdmin(database,bcrypt.hash,{email:'admin@example.test',password:'Synthetic admin password 456!'});
 const stored=(await database.query('SELECT password FROM users WHERE id=$1',[id])).rows[0].password;
 assert.notEqual(stored,'Synthetic admin password 456!');assert.equal(await bcrypt.compare('Synthetic admin password 456!',stored),true);
 await assert.rejects(bootstrapAdmin(database,bcrypt.hash,{email:'other@example.test',password:'Another synthetic password!'}),/already exists/);
 const dashboard=loadModel('adminDashboardModel.js',database);
 let summary=await dashboard.summary();assert.equal(summary.patients,0);assert.equal(summary.appointments,0);
 for(let n=0;n<27;n++)await database.query("INSERT INTO users(id,email,name,role,password,google_id) VALUES($1,$2,$3,'patient','private-hash',$4)",['p'+n,'person'+n+'@example.test','Person '+n,'google-secret-'+n]);
 const first=await dashboard.directory({status:'patient'});assert.equal(first.items.length,25);assert.equal(first.hasMore,true);
 assert.equal((await dashboard.directory({status:'patient',offset:25})).items.length,2);
 assert.equal(JSON.stringify(first).includes('private-hash'),false);assert.equal(JSON.stringify(first).includes('google-secret'),false);
 assert.equal((await dashboard.directory({search:'person26@'})).items.length,1);
 await assert.rejects(dashboard.directory({offset:-1}),/Invalid page/);
 summary=await dashboard.summary();assert.equal(summary.patients,27);
 const job=(await database.query("INSERT INTO registration_email_jobs(registration_user_id,application_version,audience,event,status) VALUES('p0',1,'patient','submitted','failed') RETURNING id")).rows[0].id;
 assert.equal((await dashboard.summary()).failed_emails,1);
 await dashboard.retryEmail(job,id);
 await assert.rejects(dashboard.retryEmail(job,id),/no longer failed/);
 assert.equal((await dashboard.summary()).queued_emails,1);
 assert.equal((await dashboard.activity({search:'retry_registration_email'})).items.length,1);
 assert.equal((await dashboard.emails({status:'pending'})).items.length,1);
 assert.equal((await dashboard.appointments({})).items.length,0);
});
