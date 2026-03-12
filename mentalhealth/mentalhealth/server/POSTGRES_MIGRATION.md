# MindBridge PostgreSQL Migration

## Schema overview

- `users`: application identities, auth providers, RBAC role state
- `profiles`: patient profile and guardian/medical fields, with PHI-encrypted JSONB columns
- `doctors`: doctor profile data and approval-ready doctor records
- `doctor_slots`: normalized appointment availability records
- `appointments`: booked appointments between patients and doctors
- `doctor_messages`: doctor inbox/history records
- `chat_conversations`: persisted AI chat history
- `posts`: community post wall data

## Environment variables

Set either `DATABASE_URL` or the individual PostgreSQL variables below:

```bash
DATABASE_URL=postgresql://mindbridge:password@localhost:5432/mindbridge

# Optional alternative to DATABASE_URL
POSTGRES_USER=mindbridge
POSTGRES_PASSWORD=password
POSTGRES_DB=mindbridge
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Optional TLS settings
POSTGRES_SSL=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=true
POSTGRES_CA_CERT=/absolute/path/to/ca.pem
```

The server also accepts standard `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGHOST`, and `PGPORT`.
If none are set, it will try `postgresql://<your-mac-username>@localhost:5432/mindbridge`.

Existing security variables still apply unchanged:

```bash
JWT_SECRET=replace-with-32-plus-char-secret
PHI_ENCRYPTION_KEY=base64-or-hex-32-byte-key
GOOGLE_CLIENT_ID=...
EMAIL_USER=...
EMAIL_PASS=...
```

## Install PostgreSQL

macOS with Homebrew:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb mindbridge
createuser mindbridge
```

Ubuntu:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --pwprompt mindbridge
sudo -u postgres createdb -O mindbridge mindbridge
```

Docker:

```bash
docker run --name mindbridge-postgres \
  -e POSTGRES_USER=mindbridge \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mindbridge \
  -p 5432:5432 \
  -d postgres:16
```

## Run migrations

```bash
cd mentalhealth/mentalhealth/server
npm install
npm run migrate:postgres
npm start
```

## Notes

- API routes and response shapes stay the same; only persistence changed.
- JWT auth, RBAC, PHI encryption, and AI safety middleware are preserved.
- Sensitive profile, appointment, and chat fields remain encrypted before storage.
