# MindBridge Production Deployment Guide on DigitalOcean

This guide deploys the existing Docker Compose stack for MindBridge on a single DigitalOcean Droplet with:

- Frontend served publicly over HTTPS
- Backend reachable through the same public domain
- PostgreSQL persisted with Docker volumes
- Ollama running locally in a container on the same host
- Nginx on the host acting as the public reverse proxy

It is designed around the current project structure:

- `docker-compose.yml`
- `.env`
- `client/Dockerfile`
- `server/Dockerfile`

## 1. Recommended Infrastructure

### Best choice: DigitalOcean Droplet

Use a Droplet, not App Platform and not Kubernetes, for the first production deployment.

Why this is the best fit for MindBridge:

- The app is already Docker Compose based.
- Ollama requires local model storage and benefits from direct VM control.
- App Platform is not a strong fit for a multi-container stack with a local LLM sidecar and persistent model files.
- Kubernetes is operationally heavier than needed for a first production release.

### Recommended Droplet size

Minimum viable production:

- `Basic Premium AMD`
- `4 vCPU`
- `8 GB RAM`
- `160 GB SSD`

Recommended if Ollama will be used heavily:

- `8 vCPU`
- `16 GB RAM`
- `200+ GB SSD`

Why:

- PostgreSQL and the Node backend are light to moderate.
- Ollama is the memory-heavy part.
- Model downloads and embeddings will consume disk space quickly.

### Region

Pick the region closest to your users and operations team.

If your users are in South Asia, use:

- `Bangalore (BLR1)` if available
- otherwise `Singapore (SGP1)`

If most users are elsewhere, choose the closest region with low latency.

## 2. High-Level Production Architecture

```text
Internet
  -> DigitalOcean DNS
  -> Host Nginx :80/:443
      -> frontend container :80
      -> backend container :3000 (for /api, /uploads, /socket.io if needed)
  -> db container :5432 (internal use only)
  -> ollama container :11434 (internal use only)
```

Notes:

- Your frontend container already contains Nginx and proxies `/api`, `/uploads`, and `/socket.io` to `backend:3000`.
- For production, the cleanest public entry is still host-level Nginx on ports `80/443`.
- The backend already trusts the proxy and rejects plain HTTP in production, so TLS termination at host Nginx is appropriate.

## 3. Create the DigitalOcean Droplet

Create a new Droplet with:

- Image: `Ubuntu 24.04 LTS`
- Plan: `Basic Premium AMD`
- Size: `4 vCPU / 8 GB RAM / 160 GB SSD` or larger
- Authentication: SSH key only
- Hostname: `mindbridge-prod-01`
- Monitoring: enabled
- Backups: enabled if budget allows

Also create and attach:

- A reserved IP if you want easier failover later

## 4. Initial Server Hardening

SSH into the server as root the first time:

```bash
ssh root@YOUR_DROPLET_IP
```

Update packages:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release ufw fail2ban git
```

Create a non-root sudo user:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Test login from your machine before disabling root:

```bash
ssh deploy@YOUR_DROPLET_IP
```

Harden SSH:

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo nano /etc/ssh/sshd_config
```

Set or confirm:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
```

Restart SSH:

```bash
sudo systemctl restart ssh
```

Configure firewall:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Enable fail2ban:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
```

## 5. Install Docker and Docker Compose

Install Docker from the official repository:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Allow the `deploy` user to run Docker:

```bash
sudo usermod -aG docker deploy
newgrp docker
```

Verify:

```bash
docker --version
docker compose version
```

Enable Docker at boot:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

## 6. Clone the Project

Create an app directory:

```bash
mkdir -p /opt/mindbridge
sudo chown -R deploy:deploy /opt/mindbridge
cd /opt/mindbridge
```

Clone the repository:

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git .
```

Move into the application root used by Compose:

```bash
cd /opt/mindbridge/mentalhealth/mentalhealth
```

Confirm files exist:

```bash
ls -la
```

You should see:

- `docker-compose.yml`
- `.env`
- `client/`
- `server/`

## 7. Production Environment Configuration

Your current `.env` file works for local development, but several values must be changed for production.

Important based on the current codebase:

- `CLIENT_ORIGIN` must be your real HTTPS domain
- `JWT_SECRET` must be at least 32 characters
- `POSTGRES_PASSWORD` must be changed from `postgres`
- `PHI_ENCRYPTION_KEY` should be replaced with a strong 64-hex-character secret

Back up the existing env file:

```bash
cp .env .env.backup
```

Edit the file:

```bash
nano .env
```

Recommended production values:

```env
# Frontend / public access
FRONTEND_PORT=8080
BACKEND_PORT=3000
CLIENT_ORIGIN=https://app.yourdomain.com

# PostgreSQL
POSTGRES_USER=mindbridge
POSTGRES_PASSWORD=CHANGE_THIS_TO_A_LONG_RANDOM_PASSWORD
POSTGRES_DB=mindbridge
POSTGRES_EXPOSE_PORT=5432
POSTGRES_SSL=false
POSTGRES_POOL_MAX=20
POSTGRES_IDLE_TIMEOUT_MS=30000

# Backend security
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_WITH_32_PLUS_CHARS
PHI_ENCRYPTION_KEY=CHANGE_THIS_TO_64_HEX_CHARACTERS

# AI / Ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EXPOSE_PORT=11434

# Optional integrations
EMAIL_USER=
EMAIL_PASS=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
GOOGLE_CLIENT_ID=
```

Generate secure secrets:

```bash
openssl rand -base64 48
openssl rand -hex 32
```

What to use them for:

- use the base64 output for `JWT_SECRET`
- use the 64-character hex output for `PHI_ENCRYPTION_KEY`

Lock down the env file:

```bash
chmod 600 .env
```

## 8. Build and Start the Stack

Pull the Ollama image and build the app images:

```bash
docker compose pull
docker compose build --no-cache
```

Start in detached mode:

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

Follow logs if something fails:

```bash
docker compose logs -f --tail=200
```

Check specific services:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
docker compose logs -f ollama
```

## 9. Initialize Ollama Models

The container stores models in the existing named volume `ollama_data`, which is good for persistence.

Download the configured model:

```bash
docker compose exec ollama ollama pull llama3
```

Verify:

```bash
docker compose exec ollama ollama list
```

If you want a smaller or larger model, update `OLLAMA_CHAT_MODEL` in `.env` and pull that exact model.

## 10. Validate Services Before Exposing Publicly

Run local server-side checks:

```bash
curl http://127.0.0.1:8080
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:11434/api/tags
```

Database check:

```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\dt'
```

If the command above fails because your shell does not expand container env vars, run:

```bash
docker compose exec db psql -U mindbridge -d mindbridge -c '\dt'
```

## 11. Domain and DNS Setup

In DigitalOcean Networking:

1. Open `Networking`
2. Add your domain
3. Create DNS records

Recommended DNS:

- `A` record: `app` -> `YOUR_DROPLET_IP`
- `A` record: `@` -> `YOUR_DROPLET_IP` if you also want the root domain

Example:

- `app.yourdomain.com` -> app
- `yourdomain.com` -> optional redirect target

Wait for DNS to propagate:

```bash
dig +short app.yourdomain.com
```

It should return your Droplet IP.

## 12. Install and Configure Host Nginx

Install Nginx and Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create the Nginx site:

```bash
sudo nano /etc/nginx/sites-available/mindbridge
```

Use this configuration for the initial HTTP setup:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mindbridge /etc/nginx/sites-enabled/mindbridge
sudo nginx -t
sudo systemctl reload nginx
```

Disable the default site if needed:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

At this point, visiting `http://app.yourdomain.com` should show the frontend.

## 13. Install SSL with Let's Encrypt

Request the certificate:

```bash
sudo certbot --nginx -d app.yourdomain.com
```

Choose the redirect option when prompted so HTTP is automatically redirected to HTTPS.

Verify renewal:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

After Certbot finishes, your Nginx config will include the SSL blocks. If you prefer a fully explicit final config, use this:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 20m;

    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer-when-downgrade always;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 14. Production Security Best Practices

### Environment variables

- Keep `.env` on the server only.
- Never commit the production `.env` file to GitHub.
- Restrict permissions with `chmod 600 .env`.

### Firewall

Allow only:

- `22/tcp`
- `80/tcp`
- `443/tcp`

Do not open:

- `3000`
- `5432`
- `11434`

Important note for the current Compose file:

- `backend`, `db`, and `ollama` are published on host ports.
- This is acceptable only if the firewall blocks public access.
- For a stricter production setup, create a production override file later so only the frontend port is published.

### SSH

- Disable root login
- Disable password login
- Use SSH keys only

### Rate limiting

If the application may receive bursts or abusive traffic, add basic rate limiting to host Nginx.

Example:

```nginx
limit_req_zone $binary_remote_addr zone=mindbridge_limit:10m rate=10r/s;

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    location /api/ {
        limit_req zone=mindbridge_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Only add rate limiting after confirming it does not interfere with login flows or websockets.

## 15. Persistence, Restart Policies, Logging, and Monitoring

### Persistence

Your current Compose file already uses named volumes:

- `postgres_data`
- `ollama_data`
- `backend_uploads`

This is correct for production persistence on a single server.

Back up volumes regularly:

```bash
docker run --rm \
  -v postgres_data:/volume \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data_backup.tar.gz -C /volume .
```

### Restart policies

Your services already use:

```yaml
restart: unless-stopped
```

That is appropriate for this setup.

### Logging

Check container logs:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 db
docker compose logs --tail=200 ollama
```

Check system logs:

```bash
sudo journalctl -u nginx -n 200 --no-pager
sudo journalctl -u docker -n 200 --no-pager
```

### Monitoring

Enable DigitalOcean Monitoring on the Droplet.

Recommended minimum monitoring stack:

- DigitalOcean agent for CPU, RAM, and disk
- uptime check against `https://app.yourdomain.com`
- alerting for high memory usage because of Ollama

## 16. Deployment Updates

When you push a new version:

```bash
cd /opt/mindbridge
git pull origin main
cd /opt/mindbridge/mentalhealth/mentalhealth
docker compose build
docker compose up -d
docker image prune -f
```

Check health:

```bash
curl -I https://app.yourdomain.com
curl https://app.yourdomain.com/api/health || true
curl http://127.0.0.1:3000/health
```

Note:

- your backend exposes `/health`
- there may not be an `/api/health` route

## 17. Optional CI/CD with GitHub Actions

A simple production approach is:

1. push to `main`
2. GitHub Actions SSHs into the Droplet
3. server runs `git pull` and `docker compose up -d --build`

Store these GitHub repository secrets:

- `DO_HOST`
- `DO_USER`
- `DO_SSH_KEY`
- `DO_PORT` with value `22`

Example workflow:

```yaml
name: Deploy MindBridge

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DO_SSH_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -p "${{ secrets.DO_PORT }}" "${{ secrets.DO_HOST }}" >> ~/.ssh/known_hosts

      - name: Deploy
        run: |
          ssh -p "${{ secrets.DO_PORT }}" "${{ secrets.DO_USER }}@${{ secrets.DO_HOST }}" '
            cd /opt/mindbridge &&
            git pull origin main &&
            cd /opt/mindbridge/mentalhealth/mentalhealth &&
            docker compose build &&
            docker compose up -d &&
            docker image prune -f
          '
```

Safer improvement later:

- build images in CI
- push them to a registry
- pull immutable tagged images on the Droplet

That is more repeatable than building on the server, but the SSH approach is fine to start.

## 18. When to Move to Kubernetes

Move from a Droplet to Kubernetes only when one or more of these become true:

- you need multiple app replicas across nodes
- you need rolling deployments with minimal downtime
- you want autoscaling
- you separate Postgres and inference into managed or dedicated services
- you need multi-environment standardization across teams

Do not move to Kubernetes just because it is considered more advanced. For the current Compose architecture, a Droplet is simpler and more reliable operationally.

## 19. Load Balancing Strategy

For the current single-node deployment:

- one Droplet
- one host Nginx
- one Compose stack

For the next scaling step:

1. move PostgreSQL to DigitalOcean Managed PostgreSQL
2. move Ollama to a dedicated inference node if usage increases
3. run multiple app nodes behind a DigitalOcean Load Balancer
4. add shared object storage for uploads if uploads must be shared across nodes

Important:

- as long as uploads are stored in a local Docker volume, horizontal scaling is limited
- Ollama is also stateful because model files live on local disk

## 20. Common Mistakes and How to Avoid Them

### Mistake 1: Keeping development secrets

Problem:

- the current `.env` includes development-grade defaults

Fix:

- replace `POSTGRES_PASSWORD`
- replace `JWT_SECRET`
- replace `PHI_ENCRYPTION_KEY`

### Mistake 2: Forgetting to update `CLIENT_ORIGIN`

Problem:

- CORS or auth issues after going live

Fix:

- set `CLIENT_ORIGIN=https://app.yourdomain.com`

### Mistake 3: Exposing Postgres or Ollama publicly

Problem:

- unnecessary attack surface

Fix:

- keep UFW limited to `22`, `80`, `443`
- do not open `5432`, `11434`, or `3000`

### Mistake 4: Requesting SSL before DNS resolves

Problem:

- Certbot validation fails

Fix:

- run `dig +short app.yourdomain.com` first
- confirm it resolves to the Droplet IP

### Mistake 5: Not pulling the Ollama model

Problem:

- AI requests fail even though the container is running

Fix:

```bash
docker compose exec ollama ollama pull llama3
```

### Mistake 6: Low-memory Droplet

Problem:

- the app works until Ollama starts serving real traffic

Fix:

- use at least `8 GB RAM`
- prefer `16 GB` if concurrent AI usage is expected

### Mistake 7: Assuming `/api/health` exists

Problem:

- health checks fail

Fix:

- use the existing backend route:

```bash
curl http://127.0.0.1:3000/health
```

## 21. Final Smoke Test Checklist

Run these after deployment:

```bash
curl -I http://app.yourdomain.com
curl -I https://app.yourdomain.com
curl https://app.yourdomain.com
curl https://app.yourdomain.com/api/posts
curl http://127.0.0.1:3000/health
docker compose ps
docker compose exec ollama ollama list
```

Validate in the browser:

- the frontend loads over HTTPS
- API requests succeed
- file uploads work
- websocket features work if used
- AI features respond successfully

## 22. Recommended Next Hardening Step

After the first successful deployment, add a production Compose override file so only the frontend port is exposed on the host and the backend, database, and Ollama are kept private to Docker networking. This is not required for the first deploy if UFW is correct, but it is the right next improvement.
