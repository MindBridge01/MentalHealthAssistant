# MindBridge

MindBridge is a mental-health support platform with a React web client, a
Flutter mobile client, and a Node.js/PostgreSQL API. The API includes
role-based patient, doctor, and administrator workflows plus a guarded AI chat
pipeline backed by local knowledge retrieval.

## Project layout

See [Project overview and audience](docs/PROJECT_OVERVIEW.md) for the product idea, user roles, feature scope, population metrics and planning decisions.

See [Software architecture](docs/ARCHITECTURE.md) for system diagrams, module ownership, data relationships, deployment boundaries and the proposed refactoring plan.

```text
client/                 React 19 + Vite web application
server/                 Express API, PostgreSQL models, migrations, and tests
lib/                    Flutter application source
android/ ios/ web/ ...  Flutter platform projects
assets/                 Flutter assets
```

The repository root is the canonical project directory. Historical local
copies named `MentalHealthAssistant/` and `mentalhealth/` are intentionally
ignored.

## Quick start

Requirements: Node.js 20+, PostgreSQL 16+, and Ollama. See
[LOCAL_SETUP.md](LOCAL_SETUP.md) for complete database, environment, and Ollama
instructions.

Install and run the web client:

```bash
npm ci
npm run dev
```

In a second terminal, install and run the API after configuring `server/.env`
and starting PostgreSQL:

```bash
cd server
npm ci
npm run migrate:postgres
npm run dev
```

The web application is available at `http://localhost:5173`, and the API
health endpoint is `http://localhost:3000/health`.

For Flutter, install a compatible Flutter SDK and run:

```bash
flutter pub get
flutter run
```

## Validation

```bash
npm run build
npm run lint
npm test
flutter analyze
flutter test
```

The server test command runs both the dependency-light registration tests and
the Jest API, model, and service suites.

## Security notes

- Never commit `.env` files, cookies, database backups, uploads, or coverage
  output.
- Keep production PostgreSQL and Ollama ports private.
- Use HTTPS in production and rotate any credential that may have appeared in
  an older repository snapshot.
