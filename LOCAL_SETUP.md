# MindBridge local setup

MindBridge runs directly on the computer with Node.js, PostgreSQL, and Ollama.
Docker is not required or supported by this repository.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 16 or newer
- Ollama
- Flutter SDK only when running the Flutter client

## 1. Install PostgreSQL on macOS

```bash
brew install postgresql@16
brew services start postgresql@16
```

Create the local database if it does not already exist:

```bash
createdb mindbridge
```

If PostgreSQL requires a dedicated account, create one and give it ownership
of the database:

```bash
createuser --pwprompt mindbridge
dropdb mindbridge
createdb -O mindbridge mindbridge
```

## 2. Configure the API

From the repository root:

```bash
cp server/.env.example server/.env
mkdir -p server/uploads
openssl rand -hex 32
openssl rand -hex 32
```

Put the generated values into `server/.env` as `JWT_SECRET` and
`PHI_ENCRYPTION_KEY`. Configure either `DATABASE_URL` or the individual
PostgreSQL variables. A typical local configuration is:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-with-first-generated-value
PHI_ENCRYPTION_KEY=replace-with-second-generated-value

DATABASE_URL=postgresql://mindbridge:your-password@localhost:5432/mindbridge
POSTGRES_SSL=false

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=llama3.2:1b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

Keep `server/.env` private. It is ignored by Git.

## 3. Install dependencies and migrate the database

```bash
npm ci
npm --prefix server ci
npm --prefix server run migrate:postgres
```

## 4. Start Ollama

Start the Ollama desktop application or run:

```bash
ollama serve
```

Download the required models once:

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text
```

The web application can start without Ollama, but AI chat and knowledge
embeddings require it.

## 5. Start the application

Start the API in one terminal:

```bash
npm --prefix server run dev
```

Start the React client in a second terminal:

```bash
npm run dev
```

Open `http://localhost:5173`. Verify the API at
`http://localhost:3000/health`.

## Optional: load the AI knowledge base

With PostgreSQL and Ollama running:

```bash
npm --prefix server run load:knowledge
```

## Optional: create an administrator

Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`, then run:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='replace-with-a-strong-password' node server/createAdmin.js
```

## Flutter client

After installing Flutter:

```bash
flutter pub get
flutter run
```

## Common checks

Check PostgreSQL:

```bash
psql -d mindbridge -c "SELECT 1;"
```

Check Ollama:

```bash
ollama list
curl http://127.0.0.1:11434/api/tags
```

Validate the project:

```bash
npm run build
npm run lint
npm test
```
