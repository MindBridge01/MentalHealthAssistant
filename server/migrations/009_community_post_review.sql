-- Keep existing published posts visible; require review for every new submission.
ALTER TABLE posts
  ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending','approved','rejected')),
  ADD COLUMN submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN review_note TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ALTER COLUMN moderation_status SET DEFAULT 'pending';
CREATE INDEX posts_review_queue ON posts(moderation_status,created_at DESC,id);
