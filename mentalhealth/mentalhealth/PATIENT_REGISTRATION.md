# Patient registration

The web signup flow now leads to `/patient/onboarding`, which displays a four-step registration form for patients. Pending doctor accounts retain their existing onboarding. The interface reuses the existing mint palette, fonts, and rounded controls.

## Included
- Adult-only university prototype registration, optional care context and trusted contact, reminder preference and versioned acknowledgements.
- Encrypted application details and review notes using the existing PHI encryption service.
- Admin review queue with approve, request information, and decline decisions. Clinical context and trusted-contact information are excluded from admin responses.
- Patient status and resubmission flow; optimistic concurrency for reviews; transactional, append-only decision history.
- Server-side approval checks for patient-module and doctor-directory/booking endpoints. Existing completed patient onboarding is grandfathered during migration.

## Setup
Run `npm run migrate:postgres` in `server` using the application's normal configured environment, then restart the API. This applies the base schema followed by `patient_registration.sql`. The implementation task did not open environment files or run migrations against a database.

The new endpoints are `GET/POST /api/registration/me` (patient) and `GET /api/registration/applications`, `PATCH /api/registration/applications/:userId` (admin). The review queue returns the oldest 100 submitted or needs-information applications. Only submitted applications can be decided; decisions require the current version. Submitted and approved applications cannot be overwritten by patient resubmission.

## Scope
Medical attachments, clinical review, email address verification, and background email delivery are not implemented in this first registration stage. The form says so and saves only the reminder preference. No SOS alert is generated. Use synthetic information for demonstrations. The Flutter application needs a corresponding registration UI/API integration before new mobile patients can access gated features.

## Checks
Run `node --test tests/registration.test.js tests/registrationAccess.test.js` from `server` for nine validation/access tests. These tests do not load environment files or connect to a database; database boundaries are mocked. Deployment testing should cover migration, concurrent reviews, patient ownership, encrypted persistence, resubmission, and the complete signup-to-approval path with a test database.

For an isolated UI demonstration, run `node scripts/preview-registration.mjs` from the web project root and visit `http://127.0.0.1:5178/patient/onboarding`. It uses synthetic data and an in-memory application, does not load environment files, and never contacts the real API or sends emails. The four-step submission and awaiting-review screen were exercised in this preview. It is not a production server.
