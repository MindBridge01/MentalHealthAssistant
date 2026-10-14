# Patient registration

## Implemented web flow

Account signup continues into /patient/registration with the entered phone and birth date. Returning patients can use the same URL; /patient/onboarding also opens the registration form. Four steps cover identity/contact details, optional care context/reports, trusted-contact preferences and explicit acknowledgements. Approval is administrative, not a diagnosis. A prior diagnosis or report is never required.

Applications are encrypted. Submission creates versioned history and queues an admin alert and patient receipt in the same transaction. Admins use Patients in the current dashboard to approve, request information or decline with a patient-facing explanation. Filters include open, approved and declined applications, with 25-row pagination. The email delivery panel lists recent jobs and can retry failed jobs. The notification link opens the review queue directly. Patients can see decisions and resubmit after a request/decline. Stale decisions and duplicate submissions are rejected.

## Private reports

The care step and application-status screen support upload, download and removal. Reports are saved immediately, independently of application submission; the UI states this. Up to three files per account, 5 MB each, PDF/PNG/JPEG. The server checks signatures, scans files, encrypts filename and content, checks ownership on downloads/removal, and records audit events. No reports are served from the public uploads folder. Admins cannot download these reports. Reports are patient-supplied and unverified; no OCR, diagnosis extraction, clinical review or clinician sharing is implemented here. Clinical record sharing requires a separate explicit workflow.

Set REGISTRATION_CLAMSCAN_PATH privately to an absolute clamscan executable path. Install ClamAV on the backend host and keep its signatures current. The backend process needs a private temporary directory; files are removed after scanning, but operators should handle abandoned temporary files after host crashes. Missing scanners, scan errors and timeouts reject uploads without blocking registration. Configure backups and retention for the encrypted database. No scanner bypass is provided.

## Setup

From the repository root, run npm --prefix server run migrate:postgres, restart the API, and run npm --prefix server run worker:registration-email in a supervised process. See EMAIL_AUTOMATION.md for SMTP settings. Preserve the existing PHI encryption key. This implementation did not open environment files, migrate the live database, or send emails.

## Verification

Run npm --prefix server run test:registry and npm --prefix server run test:emails. Tests use synthetic data and isolated PostgreSQL, cover migrations, resubmission, review conflicts, encryption, consent, access controls, document quota/ownership, multipart uploads, scanner failure, email queueing and delivery retries. JSX parsing was checked. Live browser usability, actual ClamAV scanning and Gmail inbox delivery still require deployment acceptance testing.

## Remaining release work

Account email verification/recovery and the broader authentication hardening remain separate work. Clinical report review/sharing, retention automation, and Flutter registration integration are not included. Do not describe this web feature as a complete clinical records system or a verified production deployment. Reports currently use bounded encrypted database storage; review storage and backup capacity before scaling.

## Admin review navigation

Admin emails link to /admin/dashboard?view=registrations. Sign-in preserves this destination. The dashboard has a dedicated Patient registrations entry and a mobile section selector. Administrators can filter awaiting-review, waiting-for-patient, approved and declined applications, inspect the latest 100 decision events, confirm decisions, and inspect/retry email delivery. History contains review notes, actors and timestamps, not clinical context or private attachments.
