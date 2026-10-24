ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_last_counter BIGINT NOT NULL DEFAULT -1;
CREATE TABLE auth_challenges (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL CHECK (purpose IN ('enroll','verify')), secret TEXT,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX auth_challenges_expiry ON auth_challenges(expires_at);
CREATE INDEX auth_challenges_user ON auth_challenges(user_id);
CREATE TABLE auth_sessions (
 id UUID PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE mfa_recovery_codes (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, code_hash TEXT NOT NULL,
 PRIMARY KEY(user_id, code_hash)
);
ALTER TABLE hospital_officer_invitations ADD COLUMN mfa_secret TEXT;
ALTER TABLE hospital_officer_invitations ADD COLUMN mfa_attempts INTEGER NOT NULL DEFAULT 0;
-- Older invitation jobs held plaintext tokens. Reissue pending invitations after upgrading.
UPDATE hospital_officer_invitations SET status='revoked' WHERE status='pending';
UPDATE staff_invitation_email_jobs SET token='', status='skipped' WHERE status IN ('pending','processing');
UPDATE staff_invitation_email_jobs SET token='' WHERE status IN ('sent','failed','skipped');

ALTER TABLE care_hospitals ALTER COLUMN officer_id DROP NOT NULL;
CREATE TABLE auth_attempt_windows (
 identity_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL, resets_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX auth_attempt_windows_expiry ON auth_attempt_windows(resets_at);

CREATE UNIQUE INDEX users_email_case_insensitive ON users(lower(email));
