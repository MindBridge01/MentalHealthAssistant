const {renderOfficerInviteEmail}=require('./officerEmailTemplate');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const { generateMfaSecret, getOtpAuthUrl } = require('./mfaService');

const {seal,unseal,counterFor,recoveryCodes}=require('./authSecurity');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken).trim()).digest('hex');
}

function str(value, label, max = 250) {
  if (typeof value !== 'string' || value.length > max || !value.trim()) {
    throw fail(`Provide ${label} (up to ${max} characters).`);
  }
  return value.trim();
}

function validateEmail(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw fail('Please provide a valid work email address.');
  }
  return clean;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password) > 72) {
    throw fail('Password must be between 12 and 72 characters.');
  }
  return password;
}


async function inviteHospitalOfficer(database, { adminUser, hospitalId, name: rawName, email: rawEmail }) {
  if (adminUser.role !== 'admin') throw fail('Administrator access required.', 403);
  const name = str(rawName, 'officer name', 150);
  const email = validateEmail(rawEmail);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

  return database.withTransaction(async (client) => {
    // Verify hospital exists
    const hospital = (await client.query('SELECT id, name FROM care_hospitals WHERE id = $1', [hospitalId])).rows[0];
    if (!hospital) throw fail('Assigned hospital not found.', 404);

    // Verify email is not used by non-hospital accounts
    const existingUser = (await client.query('SELECT id, role FROM users WHERE lower(email) = $1', [email])).rows[0];
    if (existingUser) {
      throw fail('This email is already associated with an existing account of a different role.', 409);
    }

    // Revoke any pending invitations for this email and hospital
    await client.query(
      "UPDATE hospital_officer_invitations SET status = 'revoked', updated_at = NOW() WHERE (lower(email) = $1 OR hospital_id=$2) AND status = 'pending'",
      [email,hospitalId]
    );

    // Insert invitation record
    const insertRes = await client.query(
      `INSERT INTO hospital_officer_invitations(hospital_id, name, email, token_hash, invited_by, expires_at)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING id, hospital_id, name, email, expires_at, created_at`,
      [hospital.id, name, email, tokenHash, adminUser._id, expiresAt]
    );
    const invitation = insertRes.rows[0];

    // Queue email job
    await client.query(
      `INSERT INTO staff_invitation_email_jobs(kind, invitation_id, email, token)
       VALUES('hospital_officer', $1, $2, $3)`,
      [invitation.id, email, seal(rawToken)]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs(user_id, user_role, action, resource_type, resource_id)
       VALUES($1, 'admin', 'invite_hospital_officer', 'hospital_officer_invitation', $2)`,
      [adminUser._id, invitation.id]
    );


    return {
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      expiresAt: invitation.expires_at,
    };
  });
}

async function listHospitalOfficerInvitations(database, { hospitalId } = {}) {
  const query = hospitalId
    ? `SELECT i.id, i.hospital_id, i.name, i.email, i.status, i.expires_at, i.accepted_at, i.created_at,
              h.name AS hospital_name, u.name AS invited_by_name
       FROM hospital_officer_invitations i
       JOIN care_hospitals h ON h.id = i.hospital_id
       JOIN users u ON u.id = i.invited_by
       WHERE i.hospital_id = $1
       ORDER BY i.created_at DESC`
    : `SELECT i.id, i.hospital_id, i.name, i.email, i.status, i.expires_at, i.accepted_at, i.created_at,
              h.name AS hospital_name, u.name AS invited_by_name
       FROM hospital_officer_invitations i
       JOIN care_hospitals h ON h.id = i.hospital_id
       JOIN users u ON u.id = i.invited_by
       ORDER BY i.created_at DESC`;

  const params = hospitalId ? [hospitalId] : [];
  const result = await database.query(query, params);
  return result.rows;
}

async function revokeHospitalOfficerInvitation(database, { adminUser, invitationId }) {
  if (adminUser.role !== 'admin') throw fail('Administrator access required.', 403);
  return database.withTransaction(async (client) => {
    const res = await client.query(
      "UPDATE hospital_officer_invitations SET status = 'revoked', updated_at = NOW() WHERE id = $1 AND status = 'pending' RETURNING id",
      [invitationId]
    );
    if (!res.rows[0]) throw fail('Invitation not found or cannot be revoked.', 404);

    await client.query(
      `INSERT INTO audit_logs(user_id, user_role, action, resource_type, resource_id)
       VALUES($1, 'admin', 'revoke_hospital_officer_invitation', 'hospital_officer_invitation', $2)`,
      [adminUser._id, invitationId]
    );
    return { success: true };
  });
}

async function resendHospitalOfficerInvitation(database, { adminUser, invitationId }) {
  if (adminUser.role !== 'admin') throw fail('Administrator access required.', 403);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

  return database.withTransaction(async (client) => {
    const inv = (await client.query(
      `SELECT i.*, h.name AS hospital_name FROM hospital_officer_invitations i
       JOIN care_hospitals h ON h.id = i.hospital_id
       WHERE i.id = $1 FOR UPDATE`,
      [invitationId]
    )).rows[0];

    if (!inv) throw fail('Invitation not found.', 404);
    if (inv.status === 'accepted') throw fail('This invitation has already been accepted.', 409);

    await client.query(
      `UPDATE hospital_officer_invitations
       SET token_hash = $2, status = 'pending', expires_at = $3, mfa_secret=NULL, mfa_attempts=0, updated_at = NOW()
       WHERE id = $1`,
      [invitationId, tokenHash, expiresAt]
    );

    await client.query(
      `INSERT INTO staff_invitation_email_jobs(kind, invitation_id, email, token)
       VALUES('hospital_officer', $1, $2, $3)`,
      [invitationId, inv.email, seal(rawToken)]
    );

    await client.query(
      `INSERT INTO audit_logs(user_id, user_role, action, resource_type, resource_id)
       VALUES($1, 'admin', 'resend_hospital_officer_invitation', 'hospital_officer_invitation', $2)`,
      [adminUser._id, invitationId]
    );

    return { success: true, expiresAt };
  });
}

async function verifyInvitationToken(database, rawToken) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 16) {
    throw fail('Invalid or missing invitation token.', 400);
  }

  const tokenHash = hashToken(rawToken);

  // Check hospital officer invitations
  const officerResult = await database.query(
    `SELECT i.*, h.name AS hospital_name, h.address AS hospital_address, h.city AS hospital_city
     FROM hospital_officer_invitations i
     JOIN care_hospitals h ON h.id = i.hospital_id
     WHERE i.token_hash = $1`,
    [tokenHash]
  );

  if (officerResult.rows[0]) {
    const inv = officerResult.rows[0];
    if (inv.status === 'accepted') {
      throw fail('This invitation link has already been used. Please log in with your credentials.', 410);
    }
    if (inv.status === 'revoked') {
      throw fail('This invitation has been revoked by administration. Please contact your administrator.', 410);
    }
    if (new Date(inv.expires_at) <= new Date()) {
      throw fail('This invitation link has expired. Please ask your administrator to resend it.', 410);
    }

    // Generate fresh secret for enrollment during page session
    const candidate=seal(generateMfaSecret());
    const saved=(await database.query('UPDATE hospital_officer_invitations SET mfa_secret=COALESCE(mfa_secret,$2) WHERE id=$1 RETURNING mfa_secret',[inv.id,candidate])).rows[0];
    const mfaSecret=unseal(saved.mfa_secret);
    const otpAuthUrl = getOtpAuthUrl({
      issuer: 'MindBridge Hospital',
      accountName: inv.email,
      secret: mfaSecret,
    });

    return {
      valid: true,
      kind: 'hospital_officer',
      invitationId: inv.id,
      name: inv.name,
      email: inv.email,
      hospitalId: inv.hospital_id,
      hospitalName: inv.hospital_name,
      hospitalLocation: `${inv.hospital_address}, ${inv.hospital_city}`,
      expiresAt: inv.expires_at,
      mfaSecret,
      otpAuthUrl,
    };
  }

  throw fail('Invalid invitation link or token not found.', 404);
}

async function acceptHospitalOfficerInvitation(database, { token: rawToken, password: rawPassword, mfaCode }) {
  if (!rawToken || typeof rawToken !== 'string') throw fail('Missing invitation token.', 400);
  const password = validatePassword(rawPassword);

  const tokenHash = hashToken(rawToken);

  return database.withTransaction(async (client) => {
    const inv = (await client.query(
      `SELECT i.*, h.name AS hospital_name FROM hospital_officer_invitations i
       JOIN care_hospitals h ON h.id = i.hospital_id
       WHERE i.token_hash = $1 FOR UPDATE`,
      [tokenHash]
    )).rows[0];

    if (!inv) throw fail('Invitation not found.', 404);
    if (inv.status === 'accepted') throw fail('This invitation link has already been used.', 410);
    if (inv.status === 'revoked') throw fail('This invitation was revoked.', 410);
    if (new Date(inv.expires_at) <= new Date()) throw fail('This invitation has expired.', 410);

    if(inv.mfa_attempts>=5 || !inv.mfa_secret) return {verificationError:'Invitation verification unavailable. Ask the administrator to resend.'};
    const secret=unseal(inv.mfa_secret);
    const counter=counterFor(mfaCode,secret);
    if(counter===null) {
      await client.query('UPDATE hospital_officer_invitations SET mfa_attempts=mfa_attempts+1 WHERE id=$1',[inv.id]);
      return {verificationError:'Invalid authenticator code.'};
    }
    const existing=(await client.query('SELECT id FROM users WHERE lower(email)=$1',[inv.email.toLowerCase()])).rows[0];
    if(existing) throw fail('An account already uses this email. Invitations cannot replace existing credentials.',409);
    const hashedPassword=await bcrypt.hash(password,12);
    const user=(await client.query(
      "INSERT INTO users(id,email,name,password,role,mfa_enabled,mfa_secret,mfa_enrolled_at,mfa_last_counter) VALUES($1,$2,$3,$4,'hospital',TRUE,$5,NOW(),$6) RETURNING id,email,name,role",
      [crypto.randomUUID(),inv.email.toLowerCase(),inv.name,hashedPassword,inv.mfa_secret,counter])).rows[0];
    const codes=await recoveryCodes(client,user.id);

    // Link officer to hospital
    await client.query(
      `UPDATE care_hospitals SET officer_id = $2 WHERE id = $1`,
      [inv.hospital_id, user.id]
    );

    // Invalidate invitation (single use)
    await client.query(
      `UPDATE hospital_officer_invitations
       SET status = 'accepted', mfa_secret=NULL, accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [inv.id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs(user_id, user_role, action, resource_type, resource_id)
       VALUES($1, 'hospital', 'accept_hospital_invitation', 'user', $1)`,
      [user.id]
    );

    return {
      _id: user.id,
      email: user.email,
      name: user.name,
      role: 'hospital',
      recoveryCodes:codes,
      hospitalId: inv.hospital_id,
      hospitalName: inv.hospital_name,
    };
  });
}

async function deliverStaffInvitationNext({ database, transport, config }) {
  const job = await database.withTransaction(async (c) => {
    await c.query(
      `UPDATE staff_invitation_email_jobs
       SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
           lease_token = NULL, locked_at = NULL
       WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '10 minutes'`
    );

    const row = (await c.query(
      `SELECT j.*, i.name, i.status AS invitation_status, i.expires_at, i.token_hash, h.name AS hospital_name
       FROM staff_invitation_email_jobs j
       JOIN hospital_officer_invitations i ON i.id = j.invitation_id
       JOIN care_hospitals h ON h.id = i.hospital_id
       WHERE j.status = 'pending' AND j.available_at <= NOW() AND j.attempts < 5
       ORDER BY j.available_at FOR UPDATE OF j SKIP LOCKED LIMIT 1`
    )).rows[0];

    if (!row) return null;

    row.lease = crypto.randomUUID();
    await c.query(
      `UPDATE staff_invitation_email_jobs
       SET status = 'processing', attempts = attempts + 1, locked_at = NOW(), lease_token = $2
       WHERE id = $1`,
      [row.id, row.lease]
    );
    return row;
  });

  if (!job) return false;

  try {
    const raw=unseal(job.token);
    if(job.invitation_status!=='pending' || new Date(job.expires_at)<=new Date() || hashToken(raw)!==job.token_hash) {
      await database.query("UPDATE staff_invitation_email_jobs SET status='skipped',token='',lease_token=NULL,locked_at=NULL WHERE id=$1 AND lease_token=$2",[job.id,job.lease]);
      return true;
    }
    const inviteUrl = new URL('/accept-invitation#token='+raw,config.appOrigin).href;
    const emailData = renderOfficerInviteEmail({
      name: job.name,
      hospitalName: job.hospital_name,
      inviteUrl,
      appOrigin: config.appOrigin,
    });

    const result = await transport.sendMail({
      from: config.from,
      to: job.email,
      messageId: `<officer-invite-${job.id}@${new URL(config.appOrigin).hostname}>`,
      ...emailData,
    });

    if (!result.accepted?.length || result.rejected?.length) {
      throw new Error('Email was rejected by SMTP server');
    }

    await database.query(
      `UPDATE staff_invitation_email_jobs
       SET status = 'sent', token='', sent_at = NOW(), lease_token = NULL, locked_at = NULL, last_error = NULL
       WHERE id = $1 AND lease_token = $2`,
      [job.id, job.lease]
    );
  } catch (error) {
    await database.query(
      `UPDATE staff_invitation_email_jobs
       SET status = $3, lease_token = NULL, locked_at = NULL, last_error = 'delivery_failed',
           available_at = NOW() + ($4 * INTERVAL '1 minute')
       WHERE id = $1 AND lease_token = $2`,
      [job.id, job.lease, job.attempts + 1 >= 5 ? 'failed' : 'pending', 2 ** (job.attempts + 1)]
    );
  }

  return true;
}

module.exports = {
  inviteHospitalOfficer,
  listHospitalOfficerInvitations,
  revokeHospitalOfficerInvitation,
  resendHospitalOfficerInvitation,
  verifyInvitationToken,
  acceptHospitalOfficerInvitation,
  deliverStaffInvitationNext,
  renderOfficerInviteEmail,
};
