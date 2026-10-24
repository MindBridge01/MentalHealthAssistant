const test=require('node:test'),assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
process.env.PHI_ENCRYPTION_KEY=require('node:crypto').randomBytes(32).toString('hex');
process.env.JWT_SECRET='Synthetic-test-secret-only-32-characters-long';
const security=require('../services/authSecurity');
const {generateTotp}=require('../services/mfaService');
const {verifyToken}=require('../lib/jwt');
const {runMigrations}=require('../migrations/migrationRunner');
const {backfillRegistry}=require('../migrations/registryBackfill');
function adapter(pg){return {query:async(sql,p=[])=>p.length?pg.query(sql,p):(await pg.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''))).at(-1)||{rows:[]},withTransaction:f=>pg.transaction(tx=>f(adapter(tx)))};}
test('MFA gates staff sessions, binds setup, rejects replay, locks attempts and consumes recovery codes',async t=>{
 const pg=new PGlite();t.after(()=>pg.close());const db=adapter(pg);
 await db.withTransaction(c=>runMigrations(c,backfillRegistry));
 for(const role of ['admin','doctor','hospital']){
  await db.query('INSERT INTO users(id,email,name,role) VALUES($1,$2,$1,$1)',[role,role+'@example.test']);
  let user={_id:role,email:role+'@example.test',role,mfaEnabled:false};
  await assert.rejects(security.issue(db,user),/MFA/);
  let challenge=await security.begin(db,user);assert.equal(challenge.requiresMfaSetup,true);
  const setup=await security.setup(db,challenge.token);
  assert.equal((await security.setup(db,challenge.token)).secret,setup.secret);
  const code=generateTotp(setup.secret);
  const result=await security.finish(db,challenge.token,code);
  assert.equal(result.recoveryCodes.length,8);
  await assert.rejects(security.finish(db,challenge.token,code),/expired/);
  user={...user,mfaEnabled:true,authVersion:1};
  const session=verifyToken(await security.issue(db,user,true));
  assert.equal((await security.validate(db,session)).role,role);
  await assert.rejects(security.validate(db,{...session,mfa:false}));
  await assert.rejects(security.validate(db,{...session,role:'patient'}));
  challenge=await security.begin(db,user);
  await assert.rejects(security.setup(db,challenge.token),/Sign in/);
  await assert.rejects(security.finish(db,challenge.token,code),/already used/);
  await security.finish(db,challenge.token,result.recoveryCodes[0]);
  challenge=await security.begin(db,user);
  await assert.rejects(security.finish(db,challenge.token,result.recoveryCodes[0]),/Invalid/);
  for(let i=0;i<4;i++)await assert.rejects(security.finish(db,challenge.token,'invalid'));
  await assert.rejects(security.finish(db,challenge.token,result.recoveryCodes[1]),/expired/);
  await db.query('DELETE FROM auth_sessions WHERE id=$1',[session.sid]);
  await assert.rejects(security.validate(db,session));
 }
 for(let i=0;i<10;i++)await security.limitAccount(db,'limited@example.test');
 await assert.rejects(security.limitAccount(db,'limited@example.test'),{status:429});
 await db.query("UPDATE auth_attempt_windows SET resets_at=NOW()-INTERVAL '1 second'");
 await security.limitAccount(db,'limited@example.test');
});
test('TOTP uses RFC 6238 SHA1 vector and fails closed on plaintext secrets',()=>{
 assert.equal(generateTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',59000),'287082');
 assert.throws(()=>security.unseal('"PLAINTEXT"'));
});
test('Google rejects every staff role even when provider identity is linked',async()=>{
 for(const role of ['admin','hospital','doctor','pending-doctor'])await assert.rejects(require('../services/googleIdentity').resolveGoogleIdentity({sub:'s',email:'e@example.test',email_verified:true},{findUserByGoogleId:async()=>({role})}),{status:403});
});
