const crypto = require('node:crypto');
const { encryptValue, decryptValue, isEncryptedValue } = require('./encryptionService');
const { generateMfaSecret, generateTotp, getOtpAuthUrl } = require('./mfaService');
const staff = role => ['doctor','hospital','admin'].includes(role);
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const seal = value => JSON.stringify(encryptValue(value));
function unseal(value) {
  const encrypted = JSON.parse(value);
  if (!isEncryptedValue(encrypted)) throw new Error('Encrypted authentication secret required');
  return decryptValue(encrypted);
}
function counterFor(code, secret, last = -1, now = Date.now()) {
  if (!/^\d{6}$/.test(String(code))) return null;
  const current = Math.floor(now / 30000);
  for (const counter of [current, current - 1, current + 1]) {
    if (counter > Number(last) && crypto.timingSafeEqual(Buffer.from(String(code)), Buffer.from(generateTotp(secret, counter * 30000)))) return counter;
  }
  return null;
}
const fail = message => Object.assign(new Error(message), {status:401});
async function limitAccount(db,email) {
  const row=(await db.query(`INSERT INTO auth_attempt_windows(identity_hash,attempts,resets_at)
    VALUES($1,1,NOW()+INTERVAL '15 minutes') ON CONFLICT(identity_hash) DO UPDATE SET
    attempts=CASE WHEN auth_attempt_windows.resets_at<=NOW() THEN 1 ELSE auth_attempt_windows.attempts+1 END,
    resets_at=CASE WHEN auth_attempt_windows.resets_at<=NOW() THEN NOW()+INTERVAL '15 minutes' ELSE auth_attempt_windows.resets_at END
    RETURNING attempts`,[digest(email)])).rows[0];
  if(row.attempts>10)throw Object.assign(new Error('Too many sign-in attempts. Try again in 15 minutes.'),{status:429});
}
async function recoveryCodes(db, userId) {
  const codes = Array.from({length:8}, () => crypto.randomBytes(10).toString('hex'));
  await db.query('DELETE FROM mfa_recovery_codes WHERE user_id=$1',[userId]);
  for (const code of codes) await db.query('INSERT INTO mfa_recovery_codes VALUES($1,$2)',[userId,digest(code)]);
  return codes;
}
async function begin(db, user) {
  if (!staff(user.role) && !user.mfaEnabled) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const purpose = user.mfaEnabled ? 'verify' : 'enroll';
  await db.withTransaction(async c => {
    await c.query('DELETE FROM auth_challenges WHERE user_id=$1 OR expires_at<NOW()',[user._id]);
    await c.query(`INSERT INTO auth_challenges(token_hash,user_id,purpose,secret,expires_at)
      VALUES($1,$2,$3,$4,NOW()+INTERVAL '10 minutes')`,[digest(token),user._id,purpose,purpose==='enroll'?seal(generateMfaSecret()):null]);
  });
  return {token, requiresMfa:true, requiresMfaSetup:purpose==='enroll'};
}
async function setup(db, token) {
  const row=(await db.query(`SELECT c.secret,u.email FROM auth_challenges c JOIN users u ON u.id=c.user_id
    WHERE token_hash=$1 AND purpose='enroll' AND expires_at>NOW() AND attempts<5 AND NOT u.mfa_enabled`,[digest(token)])).rows[0];
  if(!row) throw fail('Sign in again to start MFA setup.');
  const secret=unseal(row.secret);
  return {secret,otpAuthUrl:getOtpAuthUrl({accountName:row.email,secret})};
}
async function finish(db, token, code) {
  // Commit failed attempt counts rather than rolling them back with an exception.
  const result=await db.withTransaction(async c=>{
    const row=(await c.query(`SELECT c.*,u.mfa_enabled,u.mfa_secret,u.mfa_last_counter FROM auth_challenges c
      JOIN users u ON u.id=c.user_id WHERE token_hash=$1 FOR UPDATE OF c,u`,[digest(token)])).rows[0];
    if(!row || new Date(row.expires_at)<=new Date() || row.attempts>=5) return {error:'Verification expired. Sign in again.'};
    await c.query('UPDATE auth_challenges SET attempts=attempts+1 WHERE token_hash=$1',[row.token_hash]);
    const enroll=row.purpose==='enroll';
    if(enroll && row.mfa_enabled) return {error:'MFA is already enabled. Sign in again.'};
    const counter=counterFor(code,unseal(enroll?row.secret:row.mfa_secret),row.mfa_last_counter);
    let recovered=false;
    if(!enroll && counter===null && /^[a-f0-9]{20}$/i.test(String(code))) {
      recovered=Boolean((await c.query('DELETE FROM mfa_recovery_codes WHERE user_id=$1 AND code_hash=$2 RETURNING user_id',[row.user_id,digest(String(code).toLowerCase())])).rows[0]);
    }
    if(counter===null && !recovered) return {error:'Invalid or already used code. Try the next code from your authenticator.'};
    let codes;
    if(enroll) {
      await c.query('UPDATE users SET mfa_enabled=TRUE,mfa_secret=$2,mfa_enrolled_at=NOW(),auth_version=auth_version+1 WHERE id=$1',[row.user_id,row.secret]);
      codes=await recoveryCodes(c,row.user_id);
      await c.query('DELETE FROM auth_sessions WHERE user_id=$1',[row.user_id]);
    }
    if(counter!==null) await c.query('UPDATE users SET mfa_last_counter=$2 WHERE id=$1',[row.user_id,counter]);
    await c.query('DELETE FROM auth_challenges WHERE user_id=$1',[row.user_id]);
    return {userId:row.user_id,recoveryCodes:codes};
  });
  if(result.error) throw fail(result.error);
  return result;
}
async function issue(db,user,mfa=false) {
  if(staff(user.role) && (!user.mfaEnabled || !mfa)) throw fail('MFA verification required.');
  const sid=crypto.randomUUID();
  await db.query(`INSERT INTO auth_sessions(id,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '1 hour')`,[sid,user._id]);
  return require('../lib/jwt').generateToken({...user,sid,mfa,authVersion:user.authVersion||0});
}
async function validate(db, decoded) {
  if(!decoded.sid || decoded.purpose!=='session') throw fail('Sign in again.');
  const row=(await db.query(`SELECT u.id,u.role,u.email,u.auth_version,u.mfa_enabled FROM auth_sessions s JOIN users u ON u.id=s.user_id
    WHERE s.id=$1 AND s.user_id=$2 AND s.expires_at>NOW()`,[decoded.sid,decoded._id])).rows[0];
  if(!row || row.auth_version!==decoded.authVersion || row.role!==decoded.role || (staff(row.role) && (!row.mfa_enabled || decoded.mfa!==true))) throw fail('Sign in again to verify your access.');
  return {...decoded,role:row.role,email:row.email};
}
module.exports={staff,digest,seal,unseal,counterFor,recoveryCodes,begin,setup,finish,issue,validate,limitAccount};
