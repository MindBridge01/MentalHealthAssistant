const test = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { randomBytes } = require('node:crypto');
process.env.PHI_ENCRYPTION_KEY = randomBytes(32).toString('hex');

const { runMigrations } = require('../migrations/migrationRunner');
const { backfillRegistry } = require('../migrations/registryBackfill');
const { createCareService } = require('../services/careService');
const {
  inviteHospitalOfficer,
  listHospitalOfficerInvitations,
  verifyInvitationToken,
  acceptHospitalOfficerInvitation,
  revokeHospitalOfficerInvitation,
  resendHospitalOfficerInvitation,
} = require('../services/invitationService');
const {unseal}=require('../services/authSecurity');
const latestToken=async(db,id)=>unseal((await db.query('SELECT token FROM staff_invitation_email_jobs WHERE invitation_id=$1 ORDER BY created_at DESC',[id])).rows[0].token);
const { generateTotp } = require('../services/mfaService');

function adapter(pg) {
  return {
    query: async (sql, params = []) => {
      sql = sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', '');
      if (params.length) return pg.query(sql, params);
      return (await pg.exec(sql)).at(-1) || { rows: [] };
    },
    withTransaction: (fn) => pg.transaction((tx) => fn(adapter(tx))),
  };
}

test('Hospital booking officer invitation and MFA acceptance lifecycle', async (t) => {
  const pg = new PGlite();
  t.after(() => pg.close());
  const db = adapter(pg);
  const care = createCareService(db);

  await db.withTransaction((c) => runMigrations(c, backfillRegistry));

  const admin = { _id: 'admin_1', role: 'admin' };
  await db.query("INSERT INTO users(id, email, name, role) VALUES($1, 'admin@mindbridge.local', 'Admin User', $2)", [admin._id, admin.role]);

  // Create initial hospital
  const hospitalData = {
    name: 'Metropolitan Hospital',
    address: '100 Healthcare Blvd',
    city: 'Colombo',
    public_phone: '0112345678',
    website: 'https://metropolitan.example.com',
    officer_name: 'Initial Staff',
    officer_email: '',
    officer_password: '',
    payment_method: 'at_location',
    payment_instructions: 'Pay at front desk',
    arrival_instructions: 'Bring ID',
    cancellation_instructions: 'Call 24h prior',
    agreement_reference: 'METRO-AGREE-2026',
    demo: true,
    active: true,
  };
  const h = await care.saveHospital(admin, hospitalData);

  // 1. Admin invites a new booking officer
  const invitation = await inviteHospitalOfficer(db, {
    adminUser: admin,
    hospitalId: h.id,
    name: 'Sarah Connor',
    email: 'sarah.officer@hospital.local',
    appOrigin: 'https://mindbridge.local',
  });

  assert.ok(invitation.id);
  assert.equal(invitation.email, 'sarah.officer@hospital.local');
  assert.equal(invitation.hospitalName, 'Metropolitan Hospital');
  assert.equal(invitation.inviteUrl,undefined);

  const token = await latestToken(db,invitation.id);
  assert.ok(token);

  // 2. Officer opens the invitation link (verification)
  const verifyRes = await verifyInvitationToken(db, token);
  assert.equal(verifyRes.valid, true);
  assert.equal(verifyRes.name, 'Sarah Connor');
  assert.equal(verifyRes.email, 'sarah.officer@hospital.local');
  assert.equal(verifyRes.hospitalName, 'Metropolitan Hospital');
  assert.ok(verifyRes.mfaSecret);

  // 3. Officer submits with invalid MFA code - should fail
  const invalid=await acceptHospitalOfficerInvitation(db,{token,password:'StrongOfficerPassword123!',mfaCode:'invalid',mfaSecret:verifyRes.mfaSecret});
  assert.match(invalid.verificationError,/Invalid/);
  assert.equal((await verifyInvitationToken(db,token)).mfaSecret,verifyRes.mfaSecret);
  // 4. Officer generates valid MFA code and completes setup
  const validTotp = generateTotp(verifyRes.mfaSecret);
  const acceptedUser = await acceptHospitalOfficerInvitation(db, {
    token,
    password: 'StrongOfficerPassword123!',
    mfaCode: validTotp,
    mfaSecret: verifyRes.mfaSecret,
  });

  assert.equal(acceptedUser.recoveryCodes.length,8);
  await assert.rejects(inviteHospitalOfficer(db,{adminUser:admin,hospitalId:h.id,name:'Existing',email:'sarah.officer@hospital.local'}),{status:409});
  assert.equal(acceptedUser.role, 'hospital');
  assert.equal(acceptedUser.email, 'sarah.officer@hospital.local');
  assert.equal(acceptedUser.hospitalId, h.id);

  // Check hospital officer_id is updated to new user
  const updatedHospital = (await db.query('SELECT officer_id FROM care_hospitals WHERE id = $1', [h.id])).rows[0];
  assert.equal(updatedHospital.officer_id, acceptedUser._id);

  // Check user has mfa_enabled = true
  const userRow = (await db.query('SELECT role, mfa_enabled FROM users WHERE id = $1', [acceptedUser._id])).rows[0];
  assert.equal(userRow.role, 'hospital');
  assert.equal(userRow.mfa_enabled, true);

  // 5. Single-use check: Trying to accept again should fail
  await assert.rejects(
    acceptHospitalOfficerInvitation(db, {
      token,
      password: 'StrongOfficerPassword123!',
      mfaCode: validTotp,
      mfaSecret: verifyRes.mfaSecret,
    }),
    /already been used/
  );

  // Trying to verify again should report already used
  await assert.rejects(verifyInvitationToken(db, token), /already been used/);

  // 6. Test invite revocation
  const inv2 = await inviteHospitalOfficer(db, {
    adminUser: admin,
    hospitalId: h.id,
    name: 'Revoked Officer',
    email: 'revoked.officer@hospital.local',
    appOrigin: 'https://mindbridge.local',
  });
  const token2 = await latestToken(db,inv2.id);
  await revokeHospitalOfficerInvitation(db, { adminUser: admin, invitationId: inv2.id });
  await assert.rejects(verifyInvitationToken(db, token2), /revoked/);

  // 7. Test resend invitation
  const resent = await resendHospitalOfficerInvitation(db, { adminUser: admin, invitationId: inv2.id, appOrigin: 'https://mindbridge.local' });
  const tokenResent = await latestToken(db,inv2.id);
  const resentVerify = await verifyInvitationToken(db, tokenResent);
  assert.equal(resentVerify.valid, true);
  assert.equal(resentVerify.email, 'revoked.officer@hospital.local');
  await assert.rejects(verifyInvitationToken(db, token2));
  const messages=[];
  while(await require('../services/invitationService').deliverStaffInvitationNext({database:db,
    config:{appOrigin:'https://example.test',from:'mail@example.test'},
    transport:{sendMail:async m=>{messages.push(m);return {accepted:[m.to]};}}})){}
  assert.equal(messages.length,1);
  assert.ok(messages[0].text.includes('/accept-invitation#token='));
  assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM staff_invitation_email_jobs WHERE status IN ('sent','skipped') AND token<>''")).rows[0].n,0);
  await db.query("UPDATE hospital_officer_invitations SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1",[inv2.id]);
  await assert.rejects(verifyInvitationToken(db,tokenResent),/expired/);
});
