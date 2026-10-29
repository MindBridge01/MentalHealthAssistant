# MindBridge standalone chatbot

Built separately in `E:\mentalhealth\MentalHealthAssistant\chatbot` from the supplied **Mental_Health_Assistant_Chatbot_Design.md**. The website now embeds the shared chat component through its authenticated gateway; see `../CHATBOT_INTEGRATION.md`. Database changes still require an explicit migration. Environment files have not been edited. There is no SOS button, alert, SMS, email escalation, or automatic third-party contact.

## Start the interface preview

```powershell
cd E:\mentalhealth\MentalHealthAssistant\chatbot
npm install
npm run build
$env:CHATBOT_PUBLIC_ORIGIN = 'http://127.0.0.1:3100'
npm run demo
```

Open **http://127.0.0.1:3100**. Enter the patient or administrator preview. Preview data is held in memory and disappears on restart. Replies are labelled fixtures, not generated medical information. Preview approval records do not index documents. Use synthetic data only. Preview sessions expire after five minutes; re-enter the preview to renew.

For frontend development, run `npm run demo` and `npm run dev:ui` in separate terminals with `CHATBOT_PUBLIC_ORIGIN=http://localhost:5180`, then visit http://localhost:5180.

## What is implemented

| Area | Implementation |
|---|---|
| Frontend | Responsive React conversation UI, citations, consent, history/delete, feedback, optional memory controls, admin source upload/review/status |
| Authentication | Short-lived integration tokens with issuer/audience/signature/expiry checks; admin MFA claim required; HTTP-only same-site cookie; origin checks |
| Input safety | Deterministic rules plus context-aware semantic multi-label classifier; conservative high-risk routing; fallback on classifier failure |
| Retrieval | PostgreSQL full-text ranking + 384-dimensional pgvector search; reciprocal rank fusion; actual cross-encoder reranking; top four sources |
| Generation | Google Gemini generateContent API; bounded recent context, rolling summary and explicitly saved preferences; source-grounded prompt |
| Output checks | Policy/citation-ID checks, model-based claim/source review, one retry then controlled fallback |
| Knowledge ingestion | PDF/text upload, provenance metadata, explicit review approval, PostgreSQL leased job queue, extraction, repeated-edge cleanup, section/page-aware 350-token chunks with 60-token overlap, embeddings |
| Privacy | AES-256-GCM encrypted message/summary/memory payloads; owner checks; no patient messages in the vector index; no raw query/content logs |
| Data lifecycle | 30-day expiry; deletion cascades for message/feedback/safety/retrieval records; separate optional memory deletion; retention command |

PostgreSQL full-text ranking is **not BM25**. This deliberately uses the document's allowed initial PostgreSQL full-text option. The Sentence Transformers tokenizer defines ingestion token sizes; generation context uses conservative character budgets, not an exact Gemini token count. Validate those budgets with the selected model before release.

## Connected mode setup

Use a **new, isolated database**. Docker Desktop and sufficient RAM/disk for model downloads are required for this example. Commands below only affect this new service.

```powershell
cd E:\mentalhealth\MentalHealthAssistant\chatbot
$env:CHATBOT_DB_PASSWORD = '<new-database-password>'
docker compose up -d database models
```

The first retrieval request downloads embedding and reranking weights. Allow time for that before testing. This configuration runs on CPU by default; GPU setup and model choice depend on your hardware. No model is represented as clinically validated.

Set configuration in each service terminal, a process manager, or a secrets manager. Runtime entry points load `MentalHealthAssistant/server/.env`; process environment values take precedence:

```powershell
$env:CHATBOT_DATABASE_URL = 'postgresql://chatbot:<URL-encoded-new-password>@127.0.0.1:5434/mindbridge_chatbot'
$env:CHATBOT_DATA_KEY = '<64-hex-character-encryption-key>'
$env:CHATBOT_AUTH_SECRET = '<dedicated-random-signing-secret-at-least-32-characters>'
$env:CHATBOT_PUBLIC_ORIGIN = 'http://localhost:5180'
$env:GEMINI_API_KEY = '<your-server-side-Gemini-key>'
$env:MODEL_SERVICE_URL = 'http://127.0.0.1:8100'
$env:GEMINI_MODEL = 'gemini-2.5-flash'
npm run migrate
npm start
```

Generate independent random values with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep them secret. Losing the encryption key makes existing conversations unreadable. A rotation plan and backup restoration tests are required for deployment.

In another terminal with the same configuration, run `npm run worker`. Start the frontend with `npm run dev:ui`. Run `npm run retention` daily using your deployment scheduler. Expired records are excluded from normal reads even before the cleanup runs. Backups require a separate expiry policy.

For a built frontend served directly from port 3100, set its exact origin instead. Production requires HTTPS and `NODE_ENV=production`; place a reverse proxy in front of the service. Model services and the database must remain private. Do not expose the model-service HTTP port publicly.

## Website integration

The website integration is now mounted at `/api/chatbot/*`. The main backend validates the current website session and approval/MFA on every request, then signs an internal short-lived bearer token. No chatbot token is stored in browser localStorage or exchanged by the embedded UI. The older `integration/mindbridge-route.cjs` remains a standalone example only and is not mounted.

See `../CHATBOT_INTEGRATION.md` for shared-database migration, verified TLS, antivirus and service setup. The website imports the chatbot source from its own chatbot subfolder. The standalone preview and standalone session API remain available for local development; never expose demo mode publicly.

## API outline

- `GET /api/health`, `POST /api/session`, `GET /api/me`, `POST /api/logout`
- `GET/POST /api/conversations`; `GET/DELETE /api/conversations/:id`
- `POST /api/conversations/:id/messages` with `{ "message": "..." }`
- `GET/POST /api/memories`; `DELETE /api/memories/:id`; explicit consent required when creating
- `POST /api/feedback` with message ID, rating `1` or `-1`, optional fixed report-reason category
- Admin: `GET/POST /api/admin/documents`; `GET /api/admin/documents/:id/file`; `POST /api/admin/documents/:id/review`

Conversation creation requires `{ "consent": true }`. A chat is limited to 50 user turns and messages to 4,000 characters. PDFs must be text-based, at most 5 MB / 200 pages / 400,000 extracted characters; scanned files require a separate OCR process. Sources are English/adult only in version 1. Source URLs are metadata, never fetched automatically. Approving a source is an explicit attestation that qualified clinical review occurred, not automatic validation of the reviewer's credentials.

## Verification

```powershell
npm test
npm run build
```

Automated tests use synthetic data and mock models. `evaluation/cases.json` is an **unreviewed starter dataset**, not evidence of clinical safety. A clinical reviewer must establish expected answers and acceptable routing. Measure retrieval Recall@K/MRR against labelled relevant chunks, citation correctness, unsupported-claim rate, false-positive and false-negative safety routing, and multilingual/age suitability before release.

## Release limitations

- The implementation is a development baseline, not a clinically approved service. Rules can over-triage quoted language or miss nuanced risk. The semantic checker and generator can both be wrong; passing a model-based grounding check is not proof of correctness.
- No approved clinical corpus is bundled. Live mode abstains when evidence is missing. Source licensing, provenance, version replacement, review expiry and reviewer verification need operational governance.
- No automatic contact, emergency dispatch, helpline directory, diagnosis, medication decision, or questionnaire scoring is implemented.
- PDF parsing is resource-bounded and isolated in the model container but is not a malware scanner or a complete hostile-file sandbox. Connected-mode uploads now require `CHATBOT_CLAMSCAN_PATH` and pass an antivirus scan. Hardened ingestion isolation is still required before public uploads.
- Current in-process rate limiting is per instance. Add a shared limiter/gateway for multiple replicas, operational monitoring, deployment secret management, and a tested incident response process.
- Generation, semantic safety checks, rewriting and summaries now call Google Gemini; embeddings and reranking remain local. Assess any external provider, data processing terms, deployment jurisdiction, access controls, retention and consent before processing real health data.
- Load/integration tests against real PostgreSQL, actual downloaded models, mobile sign-in, and production infrastructure remain necessary. Pin model revisions and container digests in a reviewed release.

Technical references: [Gemini API](https://ai.google.dev/api/generate-content), [pgvector](https://github.com/pgvector/pgvector), [Sentence Transformers cross-encoders](https://sbert.net/examples/cross_encoder/applications/README.html).


## Gemini provider update
Ollama is no longer used or included in Compose. Configure `GEMINI_API_KEY` and optionally `GEMINI_MODEL` on the **standalone chatbot server process**, not in Vite/frontend variables. Runtime entry points load the website backend `server/.env`. Embedding and reranking services and pgvector remain required; existing 384-dimensional embeddings do not need rebuilding.

Free-tier testing must use synthetic, non-sensitive information only. Google unpaid-service terms prohibit submitting sensitive, confidential or personal information and allow product-improvement processing. Real patient deployment needs an appropriate reviewed provider agreement and data-processing setup. See https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/pricing. A key alone does not guarantee free quota.

The RAG pipeline uses multiple Gemini requests per turn (classification, query rewrite, answer, output review and sometimes summary/retry). Quota failures use the existing controlled fallback; no provider error body or key is logged, and no automatic retry storm is added. Default Gemini safety settings remain enabled. Live provider verification requires your key and has not been performed.


### Shared configuration
The chatbot API, ingestion worker, migration and retention entry points load `MentalHealthAssistant/server/.env` using the same loader as the backend. There is no need for `chatbot/.env` or `--env-file=.env`. From the repository root use `npm --prefix chatbot start` and `npm --prefix chatbot run worker`. These are still separate processes; automatic backend startup has not been added.
