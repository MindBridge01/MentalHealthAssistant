ALTER TABLE posts
  ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at TIMESTAMPTZ;

CREATE INDEX community_posts_review_queue
  ON posts (moderation_status, created_at DESC);

CREATE TABLE community_post_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  lease_token UUID,
  sent_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE INDEX community_post_email_queue
  ON community_post_email_jobs (status, available_at);
