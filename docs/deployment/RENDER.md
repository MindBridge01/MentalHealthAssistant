# Render deployment and CI/CD

> **Zero-budget requirement:** Paid staging and production jobs are now hard-disabled in CI/CD. The multi-service Blueprints below are retained as paid reference configurations and must not be applied for the free setup. No Render services have been provisioned. A free cloud demo requires an explicit choice of feature limits; keeping the full services at no hosting charge requires user-owned compute or separately verified free compute capacity.

The public website serves the Vite build and Express API from one origin. The chatbot API and Python model API are private services; ingestion is a background worker, and retention runs daily at 02:00 UTC. Registration email processing remains inside the single web instance. PostgreSQL stays on Supabase and must support pgvector.

## Release files

- `.github/workflows/ci-cd.yml`: lint, complete backend and chatbot tests, release-script tests, frontend build, Linux image builds, isolated PostgreSQL/container startup checks, private GHCR publication, staging deploy/smoke checks, and promotion to production.
- `deploy/app.Dockerfile`: one non-root Node image used by web, chatbot, ingestion and retention.
- `chatbot/model-service/Dockerfile`: CPU-only Python retrieval image.
- `render.yaml`: staging; `deploy/render.production.yaml`: production. These provision paid resources. Review the actual Render estimate before creating either environment. Each has a 2 GB web service, 2 GB chatbot, 4 GB model service, 512 MB worker, usage-billed retention job, 1 GB uploads disk and 5 GB model-cache disk. Supabase and Gemini charges are separate.

Images are built once per successful main commit. CI deploys and persists exact SHA-256 image digests; production receives the same digests that passed staging. Pull requests validate builds without publishing or deploying. Keep released images in GHCR for restarts, retention runs and rollback.

## First deployment

1. Connect the GitHub repository `MindBridge01/MentalHealthAssistant` to the intended Render workspace. Use Singapore for this configuration. Use a separate Supabase project/database for staging; do not point staging workers or migrations at the production database.
2. Push the pipeline to main and allow its checks and image jobs to complete. Images are published to `ghcr.io/mindbridge01/mentalhealthassistant-app` and `ghcr.io/mindbridge01/mentalhealthassistant-models`. New packages remain private unless their visibility is changed separately. The `bootstrap` tags are for initial setup only.
3. In Render workspace settings, create a GitHub Container Registry credential named `mindbridge-ghcr`. Use a GitHub credential with `read:packages` and access to these packages. Never put this credential in a YAML file or chat.
4. Create the staging Blueprint from `render.yaml`. Review its paid-resource plan. Supply its requested settings below. Disable Blueprint automatic sync after initial creation: later syncs can reset image defaults to the bootstrap tag. Changes to infrastructure should be reviewed and synced manually, followed by a digest-pinned release.
5. The public web hostname is assigned by Render. Set `APP_PUBLIC_URL` to that exact HTTPS origin, without a trailing slash; its referenced values supply CORS and chatbot origin settings. Use a custom domain later if desired. Add this origin to the Google OAuth client's authorized JavaScript origins.
6. The web pre-deploy command applies the existing PostgreSQL migrations, then the chatbot schema. Back up the target database first. The migration credential needs appropriate DDL/extension privileges. Chatbot services should use a restricted runtime database role with access to the chatbot schema. Initial private-service/worker startup can precede these migrations; restart those services after migrations complete if necessary.
7. Configure the GitHub `staging` environment and repository variables below. Run the workflow again to pin all five services to the tested image digests and perform smoke checks.
8. Create production separately using `deploy/render.production.yaml`, production database credentials and its own app origin. Configure GitHub's `production` environment with required reviewers where your GitHub plan supports them. Enable production promotion only after staging and the manual application checks pass.

## Runtime settings

Values entered in Render stay out of Git and container build inputs. Root `.env` and `server/.env` are local files only; do not upload them wholesale. The Docker context excludes environment files, backups, uploads, private keys and local dependencies.

### Web service

- `APP_PUBLIC_URL`: exact website HTTPS origin.
- `DATABASE_URL`: target environment's PostgreSQL migration/application connection. URL-encode special characters in its password.
- `DATABASE_CA_PEM`: provider's trusted CA certificate contents, if needed; otherwise leave empty. Startup writes it privately and keeps certificate verification enabled. No Windows certificate paths are used.
- `PHI_ENCRYPTION_KEY`: existing key for an existing database, or a new independent 32-byte hex key for an empty staging database. Do not replace an existing key without migrating its encrypted records.
- `GOOGLE_CLIENT_ID`: public Google OAuth client ID; startup exposes only this ID and the release SHA to the browser.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `REGISTRATION_ADMIN_EMAIL`: production mail provider configuration. Check that the chosen provider/port is usable from your hosting account; do not assume Gmail SMTP will be permitted.
- `JWT_SECRET` and the dedicated `CHATBOT_AUTH_SECRET` are generated during first provisioning. Service references keep the chatbot signing secret consistent.

### Chatbot service

- `CHATBOT_DATABASE_URL`: database connection using the chatbot schema's restricted role. For initial migration the web service uses its separate privileged connection.
- `CHATBOT_DATA_KEY`: existing key if retaining conversations; otherwise a new independent 64-character hex key.
- `GEMINI_API_KEY`: server-side provider key with appropriate quota and deployment terms.
- `GEMINI_MODEL`: configured in the Blueprint; verify provider availability for your account.

Private addresses, origins, certificate settings and signing secrets are referenced between services. The worker and retention job inherit only their required runtime configuration. Local automatic child-process startup is disabled in containers.

Rotate the database password, SMTP password and Gemini API key exposed in chat before entering production secrets. Preserve encryption keys and their protected backups until a planned data/key migration is completed.

## GitHub environment configuration

Create `staging` and `production` environments, each with:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `RENDER_API_KEY` | Render credential authorized for the selected workspace/services |
| Variable | `RENDER_OWNER_ID` | Exact intended Render workspace ID |
| Variable | `DEPLOY_URL` | Public HTTPS website origin |
| Variable | `RENDER_SERVICES_JSON` | Array below, with that environment's actual service IDs |

```json
[
  {"name":"web","id":"srv-REPLACE","image":"app"},
  {"name":"models","id":"srv-REPLACE","image":"models"},
  {"name":"chatbot","id":"srv-REPLACE","image":"app"},
  {"name":"ingestion","id":"srv-REPLACE","image":"app"},
  {"name":"retention","id":"srv-REPLACE","image":"app"}
]
```

The earlier `RENDER_DEPLOY_ENABLED` and `RENDER_PRODUCTION_DEPLOY_ENABLED` variables no longer enable the paid jobs. Both jobs currently have an explicit false condition to enforce the zero-budget requirement. Re-enabling this paid reference flow requires a code change and a new budget decision. Database/provider secrets do not belong in the GitHub test job.

## Verification and operations

`/health` is liveness; `/ready` checks PostgreSQL and reports the built release SHA. Internal probes work without the public HTTPS proxy. Render uses TCP health checks for the two private services; their HTTP health endpoints remain available for manual diagnostics. `node deploy/smoke.mjs` checks readiness, release identity, public configuration and all role SPA entry routes without creating accounts or modifying records. It does not prove that a user can authenticate or that Gemini/model retrieval is connected.

Before production promotion, check actual login/MFA, role permissions, certificate scans, profile photo uploads, booking workflows, email delivery and one chatbot conversation using synthetic data. Approve and index reviewed educational knowledge sources separately; no corpus or administrator account is seeded automatically. The model cache downloads weights on initial retrieval; allow cold-start time and confirm embedding/reranking works before opening chat access.

Both upload-receiving containers install ClamAV and download/update signatures at startup. Startup fails if the initial update fails; uploads never silently bypass scanning. ClamAV must be able to reach its signature service. Community image uploads require an approved patient session, accept PNG/JPEG/WebP files up to 5 MB and use generated filenames in the mounted directory. Uploaded community images persist on the web disk; credential and chatbot documents use the database. Persistent disks limit these services to a single instance and cause a brief deployment interruption. Back up uploaded files as well as PostgreSQL.

If a deploy fails, the pipeline stops and does not continue to subsequent services. It reports failure rather than claiming rollback. For rollback, restore the previous known-good image digests on each affected service in Render and redeploy; do not roll back database migrations automatically. Keep migrations backward-compatible with the previous application release. A public route smoke failure also requires inspection of the individual private services and provider logs.

Sources: [Render Blueprints](https://render.com/docs/blueprint-spec), [image deployments and registry access](https://render.com/docs/deploying-an-image), [Render API](https://api-docs.render.com/reference/update-service), [GitHub environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments), [Google sign-in deployment settings](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Local container startup check

Build the app image, then run the following against a fresh, synthetic database. This does not read the project environment files or contact Supabase/Gemini. The final command removes only this named test stack and its synthetic volumes.

```sh
MINDBRIDGE_TEST_IMAGE=mindbridge-app:deployment-final docker compose -p mindbridge-deployment-check -f deploy/compose.smoke.yaml --env-file /dev/null up --detach --wait web
node deploy/container-check.mjs
MINDBRIDGE_TEST_IMAGE=mindbridge-app:deployment-final docker compose -p mindbridge-deployment-check -f deploy/compose.smoke.yaml --env-file /dev/null down --volumes
```
