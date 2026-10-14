CREATE TABLE professional_applications (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
 version INTEGER NOT NULL DEFAULT 0 CHECK(version >= 0),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','needs_information','declined','approved')),
 data JSONB NOT NULL DEFAULT '{}', note TEXT NOT NULL DEFAULT '',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX professional_review_queue ON professional_applications(status,updated_at);
CREATE TABLE professional_documents (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id TEXT NOT NULL REFERENCES professional_applications(user_id) ON DELETE RESTRICT,
 kind TEXT NOT NULL CHECK(kind IN ('registration','degree')),
 content JSONB NOT NULL, filename JSONB NOT NULL,
 media_type TEXT NOT NULL CHECK(media_type IN ('application/pdf','image/png','image/jpeg')),
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 5242880),
 UNIQUE(user_id,kind)
);
CREATE TABLE professional_application_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id TEXT NOT NULL REFERENCES professional_applications(user_id) ON DELETE RESTRICT,
 actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 version INTEGER NOT NULL, status TEXT NOT NULL, snapshot JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id,version)
);
ALTER TABLE registration_email_jobs ADD COLUMN application_kind TEXT NOT NULL DEFAULT 'patient'
 CHECK(application_kind IN ('patient','professional'));
-- Keep patient and professional events distinct when an existing account changes role.
DO $$ DECLARE constraint_name TEXT; BEGIN
 FOR constraint_name IN SELECT conname FROM pg_constraint WHERE conrelid='registration_email_jobs'::regclass AND contype='u'
 LOOP EXECUTE format('ALTER TABLE registration_email_jobs DROP CONSTRAINT %I',constraint_name); END LOOP;
END $$;
ALTER TABLE registration_email_jobs ADD UNIQUE(registration_user_id,application_kind,application_version,audience);
