# Doctor registration

Four steps share the patient registration stylesheet: account, professional details, private credentials, and consent/submission. Credentials are encrypted and scanned with the configured ClamAV executable. PDF/PNG/JPEG files are limited to 5 MB each. Both registration and degree certificates are required. Scanner failures block uploads.

Admin dashboard > Verification supports approval, requests for information, decline, private credential downloads, and decision history. Approval requires a verification confirmation and a note. Verify identity, registration and scope with the issuing authority externally. Declines preserve accounts. Version checks prevent competing decisions. Encrypted snapshots retain submitted credentials and consent.

Submission queues an admin notification and applicant receipt. Decisions queue applicant emails transactionally. The existing email worker handles both patient and professional templates and retries. Documents and decision notes are excluded from email.

## Apply and run from repository root

```powershell
npm --prefix server run migrate:postgres
npm --prefix server run dev
```

In a separate terminal:

```powershell
npm --prefix server run worker:registration-email
```

Start the frontend using `npm run dev`. Restart existing backend and worker processes after migration. Existing SMTP and APP_PUBLIC_URL settings are reused. No live migration or email was performed during implementation.

Use a real database-backed administrator account. The insecure admin/admin login shortcut was removed. Approved applicants sign in again to refresh their role. Legacy pending accounts can complete the new form; old public credential URLs are not imported or trusted. Existing public files need a separate storage and retention review.

Approved professionals currently share the doctor authorization role; their professional type and scope are stored separately. This does not grant prescribing authority. Email ownership verification, administrator MFA, automated licence expiry/reverification and profession-specific clinical permissions remain launch requirements.

## Tests

Isolated PostgreSQL tests cover migrations, encryption, document ownership, submission, resubmission, stale decisions, approval and queued emails. HTTP tests cover current-role authorization and scanner failures. Tests do not load application .env files or send emails.
