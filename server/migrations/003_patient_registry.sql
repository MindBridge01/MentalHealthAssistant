-- Additive migration: existing account IDs and API contracts remain valid.
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  patient_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived')),
  demographics JSONB,
  clinical_context JSONB,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, user_id)
);
CREATE INDEX idx_patients_status_number ON patients(status, patient_number);

INSERT INTO patients(user_id, status)
SELECT u.id, CASE WHEN r.status = 'approved' THEN 'active' ELSE 'pending' END
FROM users u LEFT JOIN patient_registrations r ON r.user_id = u.id
WHERE u.role = 'patient' OR r.user_id IS NOT NULL;

ALTER TABLE patient_registrations ADD COLUMN patient_id UUID;
UPDATE patient_registrations r SET patient_id = p.id FROM patients p WHERE p.user_id = r.user_id;
ALTER TABLE patient_registrations ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE patient_registrations ADD CONSTRAINT registration_patient_owner_fk
  FOREIGN KEY (patient_id, user_id) REFERENCES patients(id, user_id) ON DELETE RESTRICT;
ALTER TABLE patient_registrations ADD CONSTRAINT registration_patient_owner_unique UNIQUE (patient_id, user_id);

CREATE TABLE registration_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  registration_user_id TEXT NOT NULL,
  application_version INTEGER NOT NULL CHECK (application_version > 0),
  details JSONB NOT NULL,
  policy_version TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('submission', 'migration_snapshot')),
  submitted_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (patient_id, registration_user_id)
    REFERENCES patient_registrations(patient_id, user_id) ON DELETE RESTRICT,
  UNIQUE (registration_user_id, application_version)
);
CREATE INDEX idx_registration_revisions_patient ON registration_revisions(patient_id, submitted_at DESC);

CREATE TABLE patient_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL DEFAULT 'trusted_contact' CHECK (purpose IN ('trusted_contact', 'legal_guardian', 'authorized_representative')),
  origin TEXT NOT NULL CHECK (origin IN ('registration', 'patient')),
  details JSONB NOT NULL,
  -- A contact is not a proxy account and has no implied notification authorization.
  verified_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, origin)
);

CREATE TABLE patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose IN ('registration_processing', 'service_limitations', 'appointment_email_reminders')),
  decision TEXT NOT NULL CHECK (decision IN ('granted', 'declined', 'withdrawn', 'acknowledged')),
  policy_version TEXT NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source_revision_id UUID REFERENCES registration_revisions(id) ON DELETE RESTRICT,
  event_sequence BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_revision_id, purpose)
);
CREATE INDEX idx_patient_consent_current ON patient_consents(patient_id, purpose, event_sequence DESC);

CREATE TABLE care_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_user_id TEXT NOT NULL REFERENCES doctors(user_id) ON DELETE RESTRICT,
  access_scope TEXT NOT NULL CHECK (access_scope IN ('demographics', 'clinical_context')),
  assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason JSONB NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR ends_at > starts_at),
  CHECK ((revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL) OR
         (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND revocation_reason IS NOT NULL))
);
CREATE UNIQUE INDEX idx_current_care_team_assignment ON care_team_assignments(patient_id, provider_user_id)
  WHERE revoked_at IS NULL;
CREATE INDEX idx_care_team_provider ON care_team_assignments(provider_user_id, patient_id)
  WHERE revoked_at IS NULL;

CREATE FUNCTION prevent_registry_history_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER registration_revisions_immutable BEFORE UPDATE OR DELETE ON registration_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_registry_history_mutation();
CREATE TRIGGER patient_consents_immutable BEFORE UPDATE OR DELETE ON patient_consents
FOR EACH ROW EXECUTE FUNCTION prevent_registry_history_mutation();
