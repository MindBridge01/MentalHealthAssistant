CREATE TABLE IF NOT EXISTS patient_registrations (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  details JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted','needs_information','approved','declined')),
  version INTEGER NOT NULL DEFAULT 1,
  consent_version TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  review_note JSONB
);
CREATE INDEX IF NOT EXISTS idx_registration_queue ON patient_registrations(status, submitted_at);
CREATE TABLE IF NOT EXISTS patient_registration_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  version INTEGER NOT NULL,
  note JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS registration_events_no_update ON patient_registration_events;
CREATE TRIGGER registration_events_no_update BEFORE UPDATE ON patient_registration_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
DROP TRIGGER IF EXISTS registration_events_no_delete ON patient_registration_events;
CREATE TRIGGER registration_events_no_delete BEFORE DELETE ON patient_registration_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
-- Preserve access for patients who completed onboarding before this feature was installed.
INSERT INTO patient_registrations(user_id, details, status, consent_version)
SELECT p.user_id, '{}'::jsonb, 'approved', 'legacy-onboarding'
FROM profiles p JOIN users u ON u.id = p.user_id
WHERE p.onboarding_completed = TRUE AND u.role = 'patient'
ON CONFLICT(user_id) DO NOTHING;
