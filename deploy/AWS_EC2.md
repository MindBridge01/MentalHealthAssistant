# GitHub Actions → EC2

Pull requests run lint, backend/chatbot/deployment tests, frontend build and a
Docker startup test against an isolated synthetic PostgreSQL database. Main
builds publish app and model images to GHCR. Production deploys those exact
digests through AWS Systems Manager (SSM), then checks the public HTTPS site.
No production credentials are needed for CI. Flutter is outside this web release.

## One-time EC2 setup

Use a Linux **x86_64** instance (images currently target amd64), Docker Engine,
Docker Compose v2 with `up --wait` support, AWS SSM Agent and an instance profile
with AmazonSSMManagedInstanceCore. The instance must appear online in Systems
Manager. Allow outbound HTTPS for SSM, GHCR, model downloads, antivirus updates
and providers, plus the configured database and SMTP ports. Size RAM/disk for
the CPU models and multiple retained images; this is not a zero-cost promise.

Configure an HTTPS reverse proxy (Nginx/Caddy) on the host forwarding to
127.0.0.1:10000. Only expose the necessary web ports; chatbot/model ports remain
inside Docker. Configure the real domain and Google OAuth authorized origins.

Create `/opt/mindbridge/runtime.env`, owned by root, mode 600. Provision its
values privately on the instance or from your secret manager, never through
GitHub artifacts. Include your existing backend/chatbot settings:

- DATABASE_URL, CHATBOT_DATABASE_URL, POSTGRES_SSL=true and provider CA via
  DATABASE_CA_PEM when needed (Compose env-file quoted multiline value).
- JWT_SECRET, PHI_ENCRYPTION_KEY, CHATBOT_DATA_KEY, CHATBOT_AUTH_SECRET. Preserve
  encryption keys across deployments; changing them can make saved data unreadable.
- APP_PUBLIC_URL, CLIENT_ORIGIN and CHATBOT_PUBLIC_ORIGIN: the HTTPS site origin.
- TRUST_PROXY_HOPS matching the actual proxy chain (one for a single host proxy).
- GEMINI_API_KEY, GOOGLE_CLIENT_ID and email SMTP/admin/from settings.
- EMAIL_WORKER_ENABLED=true. CHATBOT_DEMO=false.

Do not carry development-only Windows paths or service host overrides into this
file. In particular omit CHATBOT_SERVICE_HOSTPORT and MODEL_SERVICE_HOSTPORT;
Compose sets the internal service URLs. Runtime secrets never enter the image.

If GHCR packages are private, log root's Docker client into ghcr.io once using
a narrowly scoped read:packages credential via `docker login --password-stdin`.
Do not put this token in workflow commands. Grant the repository's GITHUB_TOKEN
write access to its two packages in GitHub package settings.

## AWS identity and GitHub settings

Create the GitHub OIDC provider `https://token.actions.githubusercontent.com`,
audience `sts.amazonaws.com`. Create a deployment IAM role whose trust policy
allows `sts:AssumeRoleWithWebIdentity` only when both conditions match:

```json
{
  "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
  "token.actions.githubusercontent.com:sub": "repo:MindBridge01/MentalHealthAssistant:environment:production"
}
```

The role needs `ssm:SendCommand` only on the selected EC2 instance ARN and
`arn:aws:ssm:REGION::document/AWS-RunShellScript`; `ssm:GetCommandInvocation`
requires Resource `*`. RunCommand executes as root: protect workflow changes
and restrict this role to the intended repository and production environment.
No AWS access-key secret or SSH private key is used.

Create GitHub environment **production**, restrict deployment branches to main
and configure reviewer approval for releases. Add these environment variables:

| Variable | Value |
| --- | --- |
| AWS_REGION | EC2 region |
| AWS_DEPLOY_ROLE_ARN | OIDC role ARN |
| EC2_INSTANCE_ID | Managed instance ID |
| DEPLOY_URL | Public HTTPS website origin |

Finally set **repository** Actions variable `AWS_DEPLOY_ENABLED=true` after the
instance, secrets, registry login and reverse proxy are ready. It is intentionally
not enabled in code. Push to main or run the workflow manually on main.

## Release and recovery

Releases live in `/opt/mindbridge/releases/COMMIT_SHA`. The deployment locks the
host, pulls images, runs both migration sets and starts all four services. Web
includes the email worker. Named volumes retain uploads, antivirus signatures
and model cache. Back up uploads and databases separately and test restoration.

Failed migrations stop before services are changed. Failed container readiness
restores the previous Compose file and images, when a previous release exists.
The first release has no rollback target. Database migrations are **not** rolled
back: use additive/backward-compatible migrations and take backups before schema
changes. A single EC2 deployment can have brief downtime.

Public smoke-check failures mark the workflow failed but do not automatically
roll back (a DNS/proxy failure is not proof the app release is bad). Inspect SSM
command logs privately. To restore an earlier compatible release, run on EC2:

```bash
bash /opt/mindbridge/releases/PREVIOUS_SHA/release.sh /opt/mindbridge/releases/PREVIOUS_SHA
```

This reruns idempotent migrations; it never restores an older database. Health
checks prove process/database readiness, not clinical validity, SMTP delivery or
the accuracy of Gemini answers. Test those integrations separately.

References: [GitHub AWS OIDC](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws),
[AWS Run Command setup](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command-setting-up.html).
