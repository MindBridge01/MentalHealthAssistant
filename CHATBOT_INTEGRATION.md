# Integrated RAG assistant

The website now uses the shared React component in `chatbot/src/ChatbotApp.jsx`. The chatbot source is included inside this repository. React is deduplicated by Vite; chatbot CSS is scoped to avoid changing other dashboards.

## Website entry points

- Patients: `/patient/chat` (existing login and approval required).
- Administrators: `/admin/dashboard?view=knowledge` (existing admin MFA required).
- Homepage chat actions open the authenticated patient chat. Anonymous model requests are retired.
- `/api/chat`, `/api/public-chat` and `/api/save-conversation` return HTTP 410. Old frontend callers and the duplicate website generation pipeline have been removed. Existing database history is preserved, not automatically imported or dropped.

## Runtime boundaries

The website forwards allowlisted `/api/chatbot/*` requests to the separate chatbot API. Every request revalidates the website session, current role, patient approval and admin MFA. The gateway mints a 60-second identity token internally. Browser cookies and client-supplied bearer tokens are never forwarded. Neither demo sessions nor chatbot session creation is exposed by the gateway. Keep the chatbot and model services private; expose only the website backend.

No database migrations, secret changes or model downloads are performed automatically.

## Configure and start

Use the existing website PostgreSQL instance, with the chatbot tables in the `chatbot` schema. Install pgvector and use a restricted chatbot DB role with access to that schema only. Never put database credentials in frontend configuration. A schema name alone is not an access boundary.

1. In the website backend configuration, set `CHATBOT_SERVICE_URL=http://127.0.0.1:3100` and a new, dedicated `CHATBOT_AUTH_SECRET` of at least 32 random characters. Do not reuse `JWT_SECRET`. The chatbot service must receive the same signing secret.
2. Apply the chatbot schema explicitly from the website root using its existing database configuration:

   ```powershell
   npm --prefix server run migrate:chatbot
   ```

3. Configure the chatbot in the website backend `server/.env` or through its process environment (it loads the website backend `server/.env`):

   | Setting | Value |
   |---|---|
   | `CHATBOT_DATABASE_URL` | Connection to the database containing the chatbot schema, preferably using its restricted role |
   | `CHATBOT_CA_CERT` | Provider CA path when needed; verified TLS remains enabled |
   | `CHATBOT_DATA_KEY` | Independent 64-character hex encryption key; back it up securely |
   | `CHATBOT_AUTH_SECRET` | Same dedicated signing secret as the website |
   | `CHATBOT_PUBLIC_ORIGIN` | Website origin, e.g. `http://localhost:5173` |
   | `CHATBOT_CLAMSCAN_PATH` | Actual ClamAV executable, with current signature database |
   | `GEMINI_API_KEY` | Server-side Google AI Studio API key |
   | `MODEL_SERVICE_URL` | Private embedding/reranking endpoint, default `http://127.0.0.1:8100` |
   | `GEMINI_MODEL` | `gemini-2.5-flash` by default; availability/quota depends on your Google project |

   Do not enable `CHATBOT_DEMO` for integration. Production requires HTTPS and `NODE_ENV=production`. PostgreSQL URL SSL parameters must not override the trusted-CA settings.

4. Start the actual model services described in the standalone README. From `E:\mentalhealth\MentalHealthAssistant\chatbot`, start `npm start` and `npm run worker` in separate processes with the same configuration. Schedule `npm run retention` daily. Production should supervise these processes and restart them after failures.
5. Start/restart the website backend and frontend normally. There is no separate chatbot login: the website session is used on each request.
6. In admin **Chatbot knowledge**, upload public educational PDF/text sources, complete qualified review, approve them, and wait for indexing to report ready. Uploads fail closed if antivirus scanning is unavailable. Never upload patient documents into this library.

## Verification and limits

The visual preview is `output/chatbot-integration-preview.html`; it uses a synthetic account and cannot send/save messages. It is not evidence of live model connectivity.

Run gateway checks with `node --test server/tests/chatbotGateway.test.js`, and run `npm test` in the standalone folder. These use synthetic data/mock models. Live Supabase, actual model downloads, corpus quality and clinical safety validation are separate checks. No diagnosis or questionnaire scoring is added by this integration. Screening requires a separately reviewed implementation.

Current tables retain the original 30-day private-data policy. Additional consent-event history, clinical-review expiry, model-version audit metadata and backup-retention governance remain follow-up work before public deployment.


## Gemini provider update
Ollama is no longer used or included in Compose. Configure `GEMINI_API_KEY` and optionally `GEMINI_MODEL` on the **standalone chatbot server process**, not in Vite/frontend variables. Runtime entry points load the website backend `server/.env`. Embedding and reranking services and pgvector remain required; existing 384-dimensional embeddings do not need rebuilding.

Free-tier testing must use synthetic, non-sensitive information only. Google unpaid-service terms prohibit submitting sensitive, confidential or personal information and allow product-improvement processing. Real patient deployment needs an appropriate reviewed provider agreement and data-processing setup. See https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/pricing. A key alone does not guarantee free quota.

The RAG pipeline uses multiple Gemini requests per turn (classification, query rewrite, answer, output review and sometimes summary/retry). Quota failures use the existing controlled fallback; no provider error body or key is logged, and no automatic retry storm is added. Default Gemini safety settings remain enabled. Live provider verification requires your key and has not been performed.


### Shared configuration
The chatbot API, ingestion worker, migration and retention entry points load `MentalHealthAssistant/server/.env` using the same loader as the backend. There is no need for `chatbot/.env` or `--env-file=.env`. From the repository root use `npm --prefix chatbot start` and `npm --prefix chatbot run worker`. These processes are now automatically managed by backend startup.


## One-command development startup
From the repository root run `npm --prefix server run dev`. The backend manages the frontend (5173), chatbot API (3100), ingestion worker, local Python retrieval service (8100), and its existing email worker. Close previously started standalone terminals first to avoid port conflicts. Configuration comes from `server/.env`. Child Node services stop on parent disconnect/watch restart, and failed services retry after ten seconds.

One-time prerequisite: install Python 3.12, then from the repository root:
```powershell
py -3.12 -m venv chatbot/.venv
& .\chatbot\.venv\Scripts\python.exe -m pip install -r chatbot/model-service/requirements.txt
```
Model weights download on first use. Allow sufficient disk space for Python packages and weights. This setup does not install or download these dependencies automatically. Alternatively set `CHATBOT_PYTHON` to a Python executable with these packages already installed.

Production does not start Vite; serve the compiled frontend through your deployment. Set `CHATBOT_AUTOSTART=false` for externally managed chatbot services, `CHATBOT_MODELS_AUTOSTART=false` for externally managed local model services, or `FRONTEND_AUTOSTART=false` when running Vite separately. A remote MODEL_SERVICE_URL is not launched locally. Migrations remain an explicit operator action.
