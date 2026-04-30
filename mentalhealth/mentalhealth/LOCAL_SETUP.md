# MindBridge Local Setup Guide

This guide is for a teammate who is cloning the project for the first time and wants to run it locally with as little guesswork as possible.

The app lives in this folder:

```bash
mentalhealth/mentalhealth
```

The stack includes:

- `frontend`: React app built and served by Nginx in Docker
- `backend`: Node.js API server in Docker
- `db`: PostgreSQL in Docker by default
- `ollama`: local AI service used by the backend by default

## 1. System Requirements

You do **not** need deep DevOps knowledge to run this project, but you **do** need a few tools installed first.

### Required tools

1. `Git`
Why: lets you clone the project from GitHub.

Official install page:

- [Git install page](https://git-scm.com/install/)

Common install commands:

```bash
# macOS with Homebrew
brew install git

# Ubuntu / Debian
sudo apt update
sudo apt install -y git
```

Verify:

```bash
git --version
```

2. `Docker Desktop` or `Docker Engine + Docker Compose`
Why: this project runs its frontend, backend, and database with Docker.

Official install pages:

- [Docker Desktop overview](https://docs.docker.com/desktop/)
- [Docker Desktop install guide](https://docs.docker.com/get-started/introduction/get-docker-desktop/)

Important:

- On macOS or Windows, install `Docker Desktop`
- On Linux, install either `Docker Desktop` or `Docker Engine` plus the Compose plugin

Verify:

```bash
docker --version
docker compose version
```

3. `Node.js 20` or newer
Why: it is optional for the Docker path, but strongly recommended for generating secrets and for running helper scripts outside Docker if needed. The Dockerfiles in this repo use Node 20.

Official download page:

- [Node.js download page](https://nodejs.org/en/download/)

Common install commands:

```bash
# macOS with Homebrew
brew install node@20

# Ubuntu / Debian
sudo apt update
sudo apt install -y nodejs npm
```

Verify:

```bash
node --version
npm --version
```

4. `Ollama`
Why: the backend sends AI requests to Ollama.

Official pages:

- [Ollama download](https://ollama.com/)
- [Ollama quickstart](https://docs.ollama.com/quickstart)
- [Ollama Linux install](https://docs.ollama.com/linux)

If you want Ollama installed directly on the laptop:

```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

Verify:

```bash
ollama --version
```

### Minimum hardware advice

- At least `8 GB RAM` is strongly recommended
- More RAM helps Ollama a lot
- Make sure Docker Desktop is running before you start the project

## 2. Clone The Project

Pick a simple location you can remember.

Example:

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/MindBridge01/MentalHealthAssistant.git
cd MentalHealthAssistant/mentalhealth/mentalhealth
```

Why this location:

- it keeps your code in one place
- it avoids cluttering your Downloads/Desktop folder
- it matches the actual Docker app root for this project

Verify that you are in the correct folder:

```bash
pwd
ls
```

You should see:

- `docker-compose.yml`
- `.env.example`
- `client/`
- `server/`

## 3. Environment Setup

The `.env` file stores configuration values such as ports, database settings, secrets, and AI settings.

### Step 1: create `.env`

Run:

```bash
cp .env.example .env
```

Why:

- `.env.example` is the template
- `.env` is the real file Docker Compose reads

### Step 2: open `.env`

Use any text editor you like.

Examples:

```bash
nano .env
```

or open it in VS Code.

### Step 3: set the required values

At minimum, set these:

```env
FRONTEND_PORT=80
BACKEND_PORT=3000
CLIENT_ORIGIN=http://localhost

JWT_SECRET=replace-this-with-a-long-random-secret
PHI_ENCRYPTION_KEY=replace-this-with-64-hex-characters

POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=mindbridge
POSTGRES_HOST=db
POSTGRES_PORT=5432

OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=llama3.2:1b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### Step 4: generate safe secrets

Use Node to create them:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use them like this:

- first command result -> `JWT_SECRET`
- second command result -> `PHI_ENCRYPTION_KEY`

Why:

- `JWT_SECRET` signs login tokens
- `PHI_ENCRYPTION_KEY` encrypts sensitive mental-health-related data

### Important variable explanations

`FRONTEND_PORT`

- the port your browser will use for the website
- default `80`
- if port 80 is busy, change it to `8080`

`BACKEND_PORT`

- the port your local machine uses to reach the Node backend
- default `3000`

`CLIENT_ORIGIN`

- the frontend URL the backend will trust for browser requests
- for local Docker use: `http://localhost`
- if you change `FRONTEND_PORT` to `8080`, change this to `http://localhost:8080`

`JWT_SECRET`

- required
- must be long and random
- if it is missing, the backend will refuse to start

`PHI_ENCRYPTION_KEY`

- required
- must be either:
  - `64 hex characters`, or
  - a valid `32-byte base64` string
- if this value is wrong, the backend will fail at startup

`DATABASE_URL`

- optional shortcut for remote PostgreSQL
- if you use this, it can replace the separate `POSTGRES_*` values

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`

- these tell the backend how to connect to PostgreSQL

`POSTGRES_SSL`

- use `false` for local Docker PostgreSQL
- use `true` for many managed/hosted PostgreSQL services

`OLLAMA_BASE_URL`

- tells the backend where Ollama is running
- default Docker value: `http://ollama:11434`
- host-installed Ollama value: `http://host.docker.internal:11434`

`OLLAMA_CHAT_MODEL`

- the model used for chat replies

`OLLAMA_EMBED_MODEL`

- the model used to create embeddings for knowledge search

## 4. Database Setup Options

You have two valid database choices.

### Option A: local PostgreSQL using Docker

Use this when:

- you want the easiest setup
- you are developing locally
- you do not need a shared cloud database

How it works:

- `docker compose up` starts a `db` container automatically
- Docker also creates a persistent volume for PostgreSQL data
- the backend connects to the hostname `db` inside Docker

Use these `.env` values:

```env
DATABASE_URL=
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=mindbridge
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_SSL=false
```

Why this is simplest:

- no separate PostgreSQL installation
- no manual database creation outside Docker
- no firewall or SSL setup

### Option B: remote PostgreSQL database

Use this when:

- your team shares one database
- you already have a managed PostgreSQL instance
- you want data outside the local laptop

Examples:

- DigitalOcean Managed PostgreSQL
- Railway PostgreSQL
- Render PostgreSQL
- Neon

#### Option B1: easiest remote setup using `DATABASE_URL`

Put the full connection string in `.env`:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOSTNAME:25060/DATABASE?sslmode=require
POSTGRES_SSL=true
```

Why this is easiest:

- one variable contains almost everything
- less chance of typing host/port/user incorrectly

#### Option B2: remote setup using separate variables

```env
DATABASE_URL=
POSTGRES_USER=YOUR_DB_USER
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
POSTGRES_DB=YOUR_DB_NAME
POSTGRES_HOST=YOUR_REMOTE_DB_HOST
POSTGRES_PORT=25060
POSTGRES_SSL=true
POSTGRES_SSL_REJECT_UNAUTHORIZED=true
```

If your provider gives you a CA certificate file, also set:

```env
POSTGRES_CA_CERT=/absolute/path/to/ca.pem
```

Important note:

- the current Docker Compose stack still starts the local `db` container
- that is okay
- when `DATABASE_URL` or `POSTGRES_HOST` points to your remote database, the backend will use the remote database instead of the local one

## 5. Ollama Setup

### What Ollama is

Ollama is the local AI server.

Simple explanation:

- your backend does **not** talk directly to ChatGPT here
- instead, it sends requests to Ollama
- Ollama runs an AI model locally and sends the answer back

### Ollama option A: use the Docker Ollama container

This is the default in `docker-compose.yml`.

Use this `.env` value:

```env
OLLAMA_BASE_URL=http://ollama:11434
```

Start the stack first:

```bash
docker compose up --build -d
```

Then pull the required models inside the container:

```bash
docker compose exec ollama ollama pull llama3.2:1b
docker compose exec ollama ollama pull nomic-embed-text
```

Why:

- `llama3.2:1b` is the chat model
- `nomic-embed-text` is the embedding model

### Ollama option B: install Ollama on the local machine

Use this when:

- you want to manage Ollama outside Docker
- you already use Ollama on your computer
- you want models to stay on the host machine

Install Ollama:

- macOS / Windows: use the installer from [ollama.com](https://ollama.com/)
- Linux:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Start Ollama:

```bash
ollama serve
```

In a second terminal, pull the models:

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text
```

Change `.env`:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_CHAT_MODEL=llama3.2:1b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

Why `host.docker.internal`:

- the backend runs inside Docker
- `localhost` inside the container means the container itself
- `host.docker.internal` lets the container reach services running on your laptop

### How to test Ollama directly

If Ollama is installed on your laptop:

```bash
curl http://localhost:11434/api/tags
```

If you are using the Docker Ollama container:

```bash
docker compose exec ollama ollama list
```

If you want to test a real model reply on the host:

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2:1b",
  "messages": [
    { "role": "user", "content": "Hello from MindBridge" }
  ],
  "stream": false
}'
```

## 6. Run The Project

From this folder:

```bash
cd ~/projects/MentalHealthAssistant/mentalhealth/mentalhealth
```

Start everything:

```bash
docker compose up --build
```

Why `--build`:

- it builds fresh images for the frontend and backend
- this avoids confusion if Docker has an old cached image

If you want it to run in the background:

```bash
docker compose up --build -d
```

What starts:

- `frontend`
- `backend`
- `db`
- `ollama`

What the backend does on startup:

- reads `.env`
- runs PostgreSQL migrations
- connects to the database
- starts the API server on port `3000`

How long it may take:

- first run: `3 to 15 minutes`
- later runs: usually much faster
- the Ollama model downloads are often the slowest part

## 7. Verify Everything Works

### Check container status

```bash
docker compose ps
```

You want to see the services as running.

### Open the frontend

If `FRONTEND_PORT=80`:

- open [http://localhost](http://localhost)

If `FRONTEND_PORT=8080`:

- open [http://localhost:8080](http://localhost:8080)

### Check backend health

```bash
curl http://localhost:3000/health
```

Expected result:

```json
{"status":"Server is running"}
```

### Check backend logs

```bash
docker compose logs backend --tail=100
```

Live logs:

```bash
docker compose logs -f backend
```

Good signs in the logs:

- `Successfully connected to PostgreSQL`
- `[migrations] PostgreSQL schema is up to date`
- `[startup] server listening on port 3000`

### Confirm database connection

Check the backend log first:

```bash
docker compose logs backend --tail=100
```

If you are using local Docker PostgreSQL, you can also connect inside the DB container:

```bash
docker compose exec db psql -U postgres -d mindbridge -c "SELECT 1;"
```

Expected result includes:

```text
?column?
----------
        1
```

If you changed `POSTGRES_USER` or `POSTGRES_DB`, update that command to match.

### Confirm Ollama is working

For Docker Ollama:

```bash
docker compose exec ollama ollama list
```

For host-installed Ollama:

```bash
curl http://localhost:11434/api/tags
```

### Optional: load local knowledge files into the database

Run this only after Ollama is working:

```bash
docker compose exec backend node scripts/loadKnowledgeBase.js
```

Why:

- it loads the text files in `server/knowledge/`
- this can improve knowledge-grounded answers

Note:

- if this step fails, the app can still run
- basic chat can still work without loaded knowledge

## 8. Common Errors And Fixes

### Error: Docker is not running

Symptoms:

- `Cannot connect to the Docker daemon`
- `docker compose` fails immediately

Fix:

1. Open Docker Desktop
2. Wait until it says Docker is running
3. Try again:

```bash
docker compose up --build
```

### Error: port already in use

Symptoms:

- `bind: address already in use`

Most common ports here:

- `80`
- `3000`

Fix:

1. Change ports in `.env`

```env
FRONTEND_PORT=8080
BACKEND_PORT=3001
CLIENT_ORIGIN=http://localhost:8080
```

2. Restart the stack:

```bash
docker compose down
docker compose up --build
```

### Error: backend says database connection failed

Symptoms:

- `PostgreSQL connection error`
- backend container exits

Fix checklist for local Docker DB:

1. Confirm the `db` container is running:

```bash
docker compose ps
```

2. Confirm local DB values in `.env`:

```env
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_SSL=false
```

3. Check DB logs:

```bash
docker compose logs db --tail=100
```

Fix checklist for remote DB:

1. Recheck hostname, port, username, password, and database name
2. If your provider requires SSL, set:

```env
POSTGRES_SSL=true
```

3. If your provider gave a `DATABASE_URL`, prefer using that
4. Restart the stack after env changes:

```bash
docker compose down
docker compose up --build
```

### Error: Ollama is not responding

Symptoms:

- AI chat fails
- backend logs show Ollama request errors

Fix for Docker Ollama:

```bash
docker compose ps
docker compose logs ollama --tail=100
docker compose exec ollama ollama list
```

If the chat model is missing:

```bash
docker compose exec ollama ollama pull llama3.2:1b
docker compose exec ollama ollama pull nomic-embed-text
```

Fix for host-installed Ollama:

1. Start Ollama:

```bash
ollama serve
```

2. Test it:

```bash
curl http://localhost:11434/api/tags
```

3. Make sure `.env` contains:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

4. Restart Docker Compose:

```bash
docker compose down
docker compose up --build
```

### Error: missing environment variables

Symptoms:

- backend crashes at startup
- messages such as:
  - `JWT_SECRET is required`
  - `PHI_ENCRYPTION_KEY is required`

Fix:

1. Open `.env`
2. Fill in the missing values
3. Restart the stack

### Error: knowledge-loading or vector-related database errors

Symptoms:

- errors mentioning `vector`
- errors during `node scripts/loadKnowledgeBase.js`

Simple explanation:

- the optional knowledge-search path is more advanced than the basic app startup
- some PostgreSQL providers need extra vector support for embedding search

Good news:

- basic app startup does not depend on this step
- basic Ollama chat can still work without loaded knowledge

## 9. Project Structure Explanation

Here is the big picture in simple terms:

1. Your browser opens the `frontend`
2. Nginx serves the built frontend files
3. When the frontend needs data, it calls the `backend`
4. The `backend` reads and writes data in PostgreSQL
5. When AI is needed, the backend sends the prompt to `Ollama`
6. Ollama returns the AI response to the backend
7. The backend returns that response to the frontend

In Docker terms:

- `frontend` talks to `backend`
- `backend` talks to `db`
- `backend` talks to `ollama`

## 10. Beginner Summary

If you only want the shortest version, do this:

1. Install `Git`, `Docker Desktop`, `Node.js`, and optionally `Ollama`
2. Clone the repo:

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/MindBridge01/MentalHealthAssistant.git
cd MentalHealthAssistant/mentalhealth/mentalhealth
```

3. Create `.env`:

```bash
cp .env.example .env
```

4. Fill in `JWT_SECRET` and `PHI_ENCRYPTION_KEY`
5. If using Docker Ollama, keep:

```env
OLLAMA_BASE_URL=http://ollama:11434
```

6. Start the app:

```bash
docker compose up --build
```

7. Pull the Ollama models:

```bash
docker compose exec ollama ollama pull llama3.2:1b
docker compose exec ollama ollama pull nomic-embed-text
```

8. Open the site:

- [http://localhost](http://localhost)

9. Check backend health:

```bash
curl http://localhost:3000/health
```

If that works, the project is running locally.
