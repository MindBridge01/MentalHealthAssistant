# MindBridge email delivery

Templates are intentionally simple: the existing dark logo, text and a sign-in link. They include a plain-text alternative. The logo is embedded using a CID attachment, not fetched from a tracking URL. Deploy `assets/logo/logodark.png` alongside the server. No diagnoses, reports, review notes, or questionnaire results are placed in emails.

## Implemented automation

Patient submission queues two emails (administrator alert and patient receipt). Review queues the appropriate approved, needs-information or declined email. Queue insertion shares the application transaction. Repeated submissions and stale reviews cannot create extra jobs. Run the separate worker to deliver them. Existing applications are not retroactively emailed.

Professional registration and appointment templates are available in `server/services/emailTemplates.js`; their event producers are not connected to this registration worker. Do not claim those notifications are active yet. Reminder preferences do not disable essential application status messages.

## Commands

From the repository root:

```powershell
npm --prefix server run test:emails
npm --prefix server run preview:emails
npm --prefix server run migrate:postgres
npm --prefix server run worker:registration-email
```

Open `email-preview/index.html` for fictional previews. The preview and template tests read no environment files and send no mail. Back up the database before migrating. Run the worker as a supervised process separately from the API. `-- --once` processes at most one due job for operational checks; it can send a real email.

Configure these settings privately using your deployment configuration (no secrets belong in Git): `APP_PUBLIC_URL`, `REGISTRATION_ADMIN_EMAIL` (one monitored mailbox), `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_SECURE` (true for implicit TLS, usually port 465), `SMTP_USER`, and `SMTP_PASSWORD`. Configure normal database access as well. Production links require HTTPS. SMTP certificate validation remains enabled and STARTTLS is required when implicit TLS is disabled. Use a verified sender with SPF/DKIM/DMARC configured through your provider.

## Reliability and limits

The worker polls every five seconds when idle, claims rows using transaction locks and SKIP LOCKED, and uses expiring leases with token fencing. It retries up to five attempts with exponential delay, then marks a job failed. Admin API endpoints expose recent jobs and retry failed ones. SMTP acceptance is recorded as `sent`, not proof of inbox delivery or reading. Provider bounce/delivery webhooks are not implemented. Delivery is at least once: a crash after SMTP acceptance but before the database update may duplicate an email; a stable Message-ID helps identify retries but cannot guarantee deduplication by recipients.

The logo previews and live SMTP delivery must be checked in the deployment's email clients before release. Configure a test mailbox for staging. No live database migration or external email send was performed during implementation.
