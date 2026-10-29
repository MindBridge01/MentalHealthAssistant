BEGIN;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS chatbot;
CREATE TABLE IF NOT EXISTS chatbot.conversations (
 id uuid PRIMARY KEY, user_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX IF NOT EXISTS conversations_owner ON chatbot.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_expiry ON chatbot.conversations(expires_at);
CREATE TABLE IF NOT EXISTS chatbot.messages (
 id uuid PRIMARY KEY, sequence_number bigint GENERATED ALWAYS AS IDENTITY, conversation_id uuid NOT NULL REFERENCES chatbot.conversations ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('user','assistant')), encrypted_payload text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS messages_conversation ON chatbot.messages(conversation_id,sequence_number);
CREATE TABLE IF NOT EXISTS chatbot.conversation_summaries (
 conversation_id uuid PRIMARY KEY REFERENCES chatbot.conversations ON DELETE CASCADE,
 encrypted_summary text NOT NULL, last_message_id uuid REFERENCES chatbot.messages ON DELETE CASCADE,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chatbot.user_memories (
 id uuid PRIMARY KEY, user_id text NOT NULL, encrypted_memory text NOT NULL,
 consent_status text NOT NULL CHECK(consent_status='explicit'), created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX IF NOT EXISTS memories_owner_expiry ON chatbot.user_memories(user_id,expires_at);
CREATE TABLE IF NOT EXISTS chatbot.documents (
 id uuid PRIMARY KEY, metadata jsonb NOT NULL, filename text NOT NULL, content bytea NOT NULL,
 mime text NOT NULL CHECK(mime IN ('application/pdf','text/plain')), digest text NOT NULL,
 review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
 state text NOT NULL DEFAULT 'waiting_review' CHECK(state IN ('waiting_review','queued','processing','ready','failed')),
 submitted_by text NOT NULL, reviewed_by text, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(review_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS documents_review ON chatbot.documents(review_status,state);
CREATE TABLE IF NOT EXISTS chatbot.document_chunks (
 id uuid PRIMARY KEY, document_id uuid NOT NULL REFERENCES chatbot.documents ON DELETE CASCADE,
 ordinal integer NOT NULL CHECK(ordinal >= 0), section text NOT NULL, page integer CHECK(page > 0),
 chunk_text text NOT NULL, parent_text text NOT NULL, embedding vector(384) NOT NULL,
 lexical tsvector GENERATED ALWAYS AS (to_tsvector('english',chunk_text)) STORED,
 UNIQUE(document_id,ordinal)
);
CREATE INDEX IF NOT EXISTS chunks_lexical ON chatbot.document_chunks USING gin(lexical);
CREATE INDEX IF NOT EXISTS chunks_dense ON chatbot.document_chunks USING hnsw(embedding vector_cosine_ops);
CREATE TABLE IF NOT EXISTS chatbot.ingestion_jobs (
 id uuid PRIMARY KEY, document_id uuid NOT NULL UNIQUE REFERENCES chatbot.documents ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','done','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0), available_at timestamptz NOT NULL DEFAULT now(),
 locked_at timestamptz, last_error text
);
CREATE INDEX IF NOT EXISTS ingestion_poll ON chatbot.ingestion_jobs(status,available_at);
CREATE TABLE IF NOT EXISTS chatbot.safety_events (
 id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES chatbot.conversations ON DELETE CASCADE,
 categories text[] NOT NULL, risk_level text NOT NULL CHECK(risk_level IN ('LOW','MEDIUM','HIGH')),
 action_taken text NOT NULL, classifier_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chatbot.retrieval_logs (
 id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES chatbot.conversations ON DELETE CASCADE,
 chunk_ids uuid[] NOT NULL, scores jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chatbot.feedback (
 id uuid PRIMARY KEY, message_id uuid NOT NULL REFERENCES chatbot.messages ON DELETE CASCADE,
 user_id text NOT NULL, rating integer NOT NULL CHECK(rating IN (-1,1)),
 report_reason text CHECK(report_reason IN ('unhelpful','unsafe','incorrect','other')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS chatbot.knowledge_audit (
 id uuid PRIMARY KEY, document_id uuid REFERENCES chatbot.documents ON DELETE SET NULL,
 actor_id text NOT NULL, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
