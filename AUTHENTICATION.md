# Authentication setup and verification

## Roles

| Account | Sign-in | Access |
| --- | --- | --- |
| Patient | Local password or verified Google identity | Existing patient registration and approval still apply. |
| Professional | Local password; authenticator MFA after approval | Pending professionals can submit registration; approved professionals cannot access protected APIs until MFA succeeds. |
| Hospital officer | Admin invitation, own password, mandatory authenticator MFA | Only assigned hospital bookings. No public officer signup. |
| Administrator | Private bootstrap, password, mandatory authenticator MFA | No public admin signup. `/admin` leads to the shared login. |

Google identifies a patient; the database determines the role. Matching an existing email never silently links accounts. A linked Google identity with a staff role is rejected. Facebook sign-in is disabled. No authentication tokens or recovery codes are persisted in browser local storage.

## Enable the changes

From `E:\mentalhealth\MentalHealthAssistant`:

```powershell
npm install
npm --prefix server run migrate:postgres
npm --prefix server start
```

Run these in separate terminals:

```powershell
npm run dev
npm --prefix server run worker:registration-email
```

Migration 008 is additive to migration 007. It revokes older pending invitations and scrubs their insecure queued tokens: **resend pending invitations after migration**. Existing staff must sign in again and enroll in MFA. The migration enforces case-insensitive unique email addresses. If existing accounts differ only by email casing, reconcile their ownership before retrying; no accounts are automatically merged. Existing password hashes are preserved; older JWT sessions are intentionally rejected. Back up the database before deploying migrations. Migrations were tested with disposable embedded PostgreSQL, not applied to the live database during this work.

The current backend loader reads `server/.env` relative to the canonical server directory, not the old nested project copy. Keep secrets private. No `.env` files were inspected or changed for this implementation.

Required existing backend settings: `DATABASE_URL`, `JWT_SECRET` (at least 32 characters), and `PHI_ENCRYPTION_KEY` (32 bytes, hex/base64). Keep the encryption key stable and back it up securely: it encrypts MFA secrets as well as existing sensitive records. SMTP settings remain unchanged. `APP_PUBLIC_URL` is the frontend URL, such as `http://localhost:5173`, not backend port 3000.

For Google, configure a **Web application OAuth client** in your Google project:

- Backend setting: `GOOGLE_CLIENT_ID`.
- Frontend root Vite environment setting: `VITE_GOOGLE_CLIENT_ID`, with the same public client ID. Never put a client secret in frontend configuration.
- Authorize the exact frontend JavaScript origin (development: `http://localhost:5173`; production: your HTTPS site).
- Restart the backend and Vite after changing configuration. Rebuild the frontend for production.
- Without a configured frontend ID, the UI explains that Google is unavailable instead of displaying a nonfunctional sign-in button.

Production requires HTTPS, `NODE_ENV=production`, and explicit `CLIENT_ORIGIN`. Deploy frontend and API under the same site for Strict cookies. `TRUST_PROXY_HOPS` defaults to no trusted proxy; set it only for a verified, fixed reverse-proxy topology that strips spoofed forwarding headers. Cookies are HttpOnly and Secure in production.

## MFA and invitation mechanics

Password validation creates a 10-minute, HttpOnly challenge cookie for staff, **not** a full session. The encrypted enrollment secret is bound to the server challenge; callers cannot choose a replacement secret. An existing MFA enrollment cannot be overwritten through setup. Five failed challenge attempts exhaust that challenge. Primary password attempts also have a database-backed per-email limit (10 per 15 minutes), plus an in-process IP limit. Do not treat the IP limiter as a distributed perimeter control.

Codes use 30-second TOTP windows with a one-step clock allowance. Accepted counters cannot be reused. Eight random recovery codes are displayed once, stored as hashes, and consumed atomically. Keep them privately in a password manager. Staff sessions require a verified MFA claim, a live session row, unchanged account version, and matching current database role. Logout deletes the session row. Sessions expire after one hour.

The browser generates QR codes locally; it does not transmit setup secrets to a QR image service. Enrollment and recovery responses are marked `Cache-Control: no-store`. Do not add analytics/session-recording scripts to these screens.

Admins save the hospital, then invite its officer. The server generates the token. The database stores a hash for verification and an encrypted token in the durable email outbox. Only the recipient email receives the setup URL. Links use a URL fragment so the token is not part of the initial HTTP URL. The page removes it from the address bar, then verifies by POST. Accepting sets password and MFA, assigns the hospital, and consumes the invitation in one transaction. Existing account credentials cannot be replaced by an invitation. Resending rotates the token; revoked, expired, accepted, or superseded queued invitations are skipped. Delivered token payloads are scrubbed. SMTP acceptance does not guarantee inbox delivery.

## Verification and remaining launch work

```powershell
npm --prefix server run test:auth
node --test server/tests/*.test.js
npm --prefix server run worker:registration-email -- --check
```

Automated tests use synthetic users, disposable PostgreSQL, and mocked email delivery. UI screenshots in `output/auth-ui` use mocked responses and fictional data; the QR key and recovery codes shown are demonstration values. Actual Google sign-in, real SMTP delivery, migration against your Supabase instance, and production proxy behavior still require deployment checks.

This implementation uses authenticator TOTP, not phishing-resistant passkeys/security keys. Self-service forgotten-password reset, lost-all-factors recovery, MFA-device replacement, verified email changes, and recovery-code regeneration are not implemented. The login screen explains the current password-recovery limitation. Design these as separate, identity-verified workflows; do not bypass MFA or share staff passwords to recover access. Local signup email verification and breached-password screening also remain launch work. This is not a certification of healthcare or security compliance.

Schedule retention cleanup for expired auth sessions, challenges, and attempt windows. Review the dependency advisories reported by npm and obtain a deployment security review before using real patient data.
