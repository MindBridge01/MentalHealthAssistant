# Portal frontend review — 26 October 2026

Implemented the current Mind Bridge Figma account layout, using reference frame 21:72 and the patient/professional registration screens in qBwHaSZX7yxZsIxNMfkGGv. Shared PortalShell and scoped portal styles cover patient and professional login, account creation, onboarding, credential uploads, review/status screens, MFA, and the existing unavailable-password-recovery notice.

The current Figma tokens are muted plum (#493863 primary, #534070 action, #2a2038 sidebar), Google Sans Flex, neutral surfaces, 12px form corners, and the cropped Mind Bridge logo. The background was downloaded from Figma and encoded as lossless WebP; decoded pixels were compared and are identical, reducing 6.35 MB to 1.41 MB. The existing identical logo asset is reused.

## Checks

- Production Vite build passes (existing large-chunk advisory remains).
- Focused ESLint: no errors; existing exhaustive-deps warning in DoctorSignupWizard remains.
- git diff --check passes.
- Browser review at desktop and 390px mobile: no horizontal overflow in the checked login, patient details, and MFA setup screens.
- Patient details → care → contact → review progression checked with sample data.
- Doctor details → credentials → review and submitted status checked with sample data.
- Existing login validation, MFA transition, disabled empty-code verification, access-help return, role navigation, and privacy dialog checked.
- Protected registration/MFA screens reviewed on an isolated local preview origin with every fetch intercepted by fixtures. No real account, credential, application, or report was created or updated.
- API paths, request payloads, authentication handlers, upload rules, and backend files were preserved. The pre-existing server/package-lock.json change was not modified.

Screenshots in this folder document desktop and mobile results. The temporary mocked preview has been removed after testing.
