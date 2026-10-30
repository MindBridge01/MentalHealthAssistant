# Dashboard design review

Reviewed the active React routes and their API handlers before changing the UI. Legacy dashboard files that are not routed by App.jsx were excluded. Pending professionals continue through registration; they do not receive an approved dashboard.

## Design reference

[Figma foundations](https://www.figma.com/design/qBwHaSZX7yxZsIxNMfkGGv/Mind-bridge?node-id=0-1&m=dev): Google Sans Flex type register (2:483), layout foundations (2:757), radius scale (2:403), spacing scale (2:50), and the Mind Bridge portal sidebar (33:940). The linked page contains foundations and registration/access examples, rather than finished dashboards. The dashboard compositions are new applications of those foundations.

The portal's current purple scale differs from the older vivid-purple JSON under design-assets/. Dashboards use the Figma portal values: purple/50 #f8f7f9, /100 #eeecf1, /200 #d9d5e0, /300 #bab3c6, /400 #8a7d9e, /600 #493863, /700 #3e3054, /800 #332845, /900 #2a2038, /950 #1b1424. Primary controls use #534070. Neutral text and borders use #171717, #525252, #737373, and #e5e5e5. Semantic red/amber/green identify errors, pending decisions, and confirmed states.

The shared DashboardShell and dashboard.css centralize the shell, tokens, navigation, headings, metrics, panels, buttons, empty states, mobile drawer, and focus treatment. Existing locally bundled fonts, the exact Mind Bridge logo, and the installed Material Icons font are reused. No temporary Figma URLs are runtime dependencies.

## Active role and feature inventory

| Role | Route | Features retained and organized |
| --- | --- | --- |
| Patient | /patient/dashboard | AI chat, assessments, activities, community, professional directory, confirmed appointments, SOS confirmation, sign-out. The overview now also displays the existing communityHighlights response. |
| Professional (doctor, psychologist, counsellor accounts use the approved doctor role) | /doctor/dashboard | Read-only verified identity, professional photo upload, editable public profile, publication and accepting-request flags, linked hospitals, appointment-slot creation/removal, appointment list, profile setup guide. Organized into Overview, Public profile, Availability, and Appointments. |
| Hospital booking officer | /hospital/dashboard | Assigned-hospital booking list, confirmation, declining, proposing alternatives, cancellation, completion and non-attendance. Organized into Overview, Requests to review, Confirmed appointments, and Past decisions. |
| Administrator | /admin/dashboard | Patient applications, professional verification, account directory, chatbot knowledge, hospitals, officer invitations and affiliations, hospital bookings and delivery, legacy appointments, registration email monitoring/retry, audit activity. Existing validation and permissions remain in place. |

All metrics derive from existing API responses. The patient upcoming-appointment endpoint returns the next three confirmed appointments. Professional/hospital booking metrics summarize the records returned by the existing booking endpoint (currently capped at 200), rather than introducing analytics endpoints or fabricated trends.

## Isolated review

Run `npm run preview:dashboards`, then open:

- [Patient](http://127.0.0.1:5182/patient/dashboard?previewRole=patient)
- [Professional](http://127.0.0.1:5182/doctor/dashboard?previewRole=doctor)
- [Hospital](http://127.0.0.1:5182/hospital/dashboard?previewRole=hospital)
- [Administrator](http://127.0.0.1:5182/admin/dashboard?previewRole=admin)

The preview server has `envDir: false`, intercepts every /api/ request, and only uses fictional data and in-memory changes. It does not use database credentials, send mail, or grant actual account permissions. The preview-only role parameter is handled by the separate Vite fixture and is not part of the application or production authentication.

Before/after and mobile screenshots are saved in artifacts/dashboards/. Browser verification covers each role's overview, professional profile save and slot creation, appointment search, hospital confirmation and alternative-slot controls, every admin section, approval prerequisites, patient empty/error states, 320/390/768/1024px layouts, and keyboard dismissal of the mobile drawer. API actions were exercised against this fixture, not the connected remote database.

## Scope

This update is for the active web dashboards and their shared role navigation. Existing registration/login work was preserved. No changes were made to server authorization, credentials, registration approval, database records, clinical behavior, or Flutter screens. The implementation follows the editable desktop and mobile role screens in the [Figma dashboard collection](https://www.figma.com/design/qBwHaSZX7yxZsIxNMfkGGv/Mind-bridge?node-id=95-1211). The newer chatbot knowledge workspace and professional photo upload are preserved, with photo controls adapted to the shared purple tokens.

[Before/after review gallery](http://127.0.0.1:5182/artifacts/dashboards/index.html) includes live links and mobile screenshots for all four roles. Lint reports no errors in the changed application files; the care shared module retains its existing mixed-export Fast Refresh warnings. The production build retains the existing large-chunk advisory.
