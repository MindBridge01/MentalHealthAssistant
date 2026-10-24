# Hospital booking and professional profiles

## Enable locally

From the project root, run `npm --prefix server run migrate:postgres` to apply all pending migrations (including 007–008 for secure invitations and MFA). Then start the backend (`npm --prefix server start`), frontend (`npm run dev`) and the existing email worker (`npm --prefix server run worker:registration-email`) in separate terminals. The worker now handles registration and appointment notifications, expiry and 24-hour reminders. Restart an already-running worker after deployment. Apply migrations before starting this version.

No environment files are required to be committed. Existing SMTP / APP_PUBLIC_URL / MAIL_FROM / REGISTRATION_ADMIN_EMAIL settings are reused. `APP_PUBLIC_URL` must be the frontend's reachable URL. The development server uses 5173; backend uses 3000. `--check` checks queues and SMTP without sending messages. `--once` runs one maintenance pass and at most one job from each queue.

## Demo walkthrough

1. Register a professional at `/signup/doctor`, using synthetic qualifications. The form supports doctor, counsellor and psychologist. Country is required. Doctor registration is mandatory; other professions can explain non-applicability for manual administrator verification. Never interpret this checkbox as verification.
2. Approve the application in Admin > Professional verification. The approval email links to the dashboard and `/professional-setup-guide.html`. The guide supports browser Print / Save as PDF.
3. Admin > Hospitals & centres: create a clearly fictional hospital, leaving Demo checked. Save the hospital first, then use Invite Booking Officer with a team-controlled, dedicated email. The officer receives a 48-hour, single-use link and sets their own password and MFA. Existing accounts cannot be overwritten through an invitation. See AUTHENTICATION.md for setup and migration notes.
4. Enter the public address/phone, payment instructions, arrival/cancellation instructions and offline agreement reference. Link the approved professional. Real partnership verification and agreements remain offline. Deactivate links or the hospital to stop new requests.
5. Sign in as the professional. Approved identity is read-only. Complete biography, services, languages and age groups. Publish and enable requests. Add individual appointments at an assigned location. Inputs use the device timezone and are stored as UTC instants; display uses the supplied IANA timezone. No recurring schedule generator is included.
6. Sign in as an approved synthetic patient. Choose the professional, hospital and slot, acknowledge the instructions, and submit. The request is pending, not confirmed. Payment is external; no payment status is inferred.
7. Sign in through `/login` as the hospital account, which opens `/hospital/dashboard`. Only this hospital's assigned officer can review its requests. Confirm, decline, or propose another available slot at the same hospital with the same professional. A proposed time requires patient acceptance.
8. Inspect separate patient, hospital, professional and admin notifications. Admin > Hospital bookings includes email queue status and failed-job retry. Sent means SMTP acceptance, not inbox delivery. Every demo booking email has a DEMO subject and notice.
9. Cancel future requests from the patient or hospital dashboard. Hospital staff can mark confirmed appointments completed or not attended after the appointment ends.

## Reliability and privacy

- Transactional outbox: state changes, event history and notification jobs commit together.
- Single active reservation per slot; transaction locks prevent simultaneous duplicate requests; overlapping professional slots across hospitals and patient bookings are rejected.
- Requests and proposals expire after 24 hours or at the slot start, whichever is earlier. The running worker releases expired reservations. Without the worker, expiry and reminders do not run.
- Reminders are queued once per booking version within 24 hours of a confirmed appointment. Events superseded before dispatch are skipped. An in-flight email can still race a subsequent update; the portal is authoritative.
- Five delivery attempts, exponential delay, lease recovery and fencing. Delivery is at least once; a worker crash after SMTP acceptance can produce a duplicate email.
- Hospital permissions use the current account role and current hospital assignment. The hospital desk contains booking metadata/contact email only, never reports or chatbot history. Internal officer emails are excluded from patient listings.
- Professional credentials remain in the existing encrypted application records; approved public identity is projected through an allowlist. Free-text profiles must not contain patient information. Changing verified credentials needs administrator review, not public profile editing.
- Credential expiry is collected and validated during registration; periodic re-verification/suspension operations remain manual.
- Legacy doctor mutation endpoints return 410 so they cannot bypass this workflow. Existing legacy appointment records remain in the database and admin legacy view; they are not automatically converted or emailed.
- New bookings cover in-person hospital/clinic appointments. No online-consultation system, payment gateway, recurring schedule builder or profile-photo uploader is included.

## Validation

`npm --prefix server run test:care` runs embedded-PostgreSQL lifecycle/outbox tests and role-isolation tests using synthetic data. No live database or SMTP credentials are required. The full node test suite is `node --test server/tests/*.test.js`.

The application must still be tested with your actual migrated database and test SMTP inbox before a demo. Real patient deployment requires the separate operational/privacy/security and professional governance work described in the project documents.
