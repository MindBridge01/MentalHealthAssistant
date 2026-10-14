CREATE TABLE registration_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  application_version INTEGER NOT NULL CHECK (application_version > 0),
  audience TEXT NOT NULL CHECK (audience IN ('admin','patient')),
  event TEXT NOT NULL CHECK (event IN ('submitted','approved','needs_information','declined')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  lease_token UUID,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(registration_user_id, application_version, audience)
);
CREATE INDEX registration_email_due ON registration_email_jobs(available_at) WHERE status = 'pending';
CREATE INDEX registration_email_owner ON registration_email_jobs(registration_user_id, created_at DESC);

-- Small, bounded attachments are encrypted and stored transactionally. No public upload URLs.
CREATE TABLE registration_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  metadata JSONB NOT NULL,
  content JSONB NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('application/pdf','image/png','image/jpeg')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX registration_documents_owner ON registration_documents(user_id, created_at DESC);
