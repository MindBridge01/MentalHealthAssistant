# Administrator workspace and authentication

The dashboard uses the patient registration palette, rounded panels and responsive layout. Overview counts come from PostgreSQL, including zero values. It exposes patient review, professional verification, account search and role filtering, read-only appointment listings, registration email monitoring/retries, and paginated audit activity. Clinical notes, password hashes, provider IDs and email bodies are excluded from operational listings. Query-string navigation supports review links and browser history. Reviews refresh overview counts.

The old placeholder payment, calendar, content and reporting modules are not shown as working features. Content publishing and appointment modification remain separate work. Directory access is read-only; professional approvals stay in credential review.

## Admin access policy

Do not put an admin role option in public signup. Provision an individual admin account privately and store its password hash and role in users. The running server must not compare login input with a permanent password from .env. The REGISTRATION_ADMIN_EMAIL setting routes notifications; it grants no permissions.

Automatic default-admin creation and hardcoded administrator credentials were removed from startup. General role editing cannot create admin accounts, demote administrators or delete them. Current database role is checked for every admin request. Existing seeded accounts are NOT revoked by this code change. If the old default account was created, the operator must rotate its password or revoke its access through a controlled database/access-management procedure before deployment.

First-admin setup is an explicit operator command. It uses an advisory lock, refuses to run if any administrator exists, refuses to promote an email collision, hashes the password using bcrypt cost 12, and records an audit event in the same transaction. It is not an invitation flow for additional administrators. Additional-admin invitations, reauthentication and MFA remain to be implemented or handled by a managed identity provider.

### First administrator only

Apply the existing migrations first. From the repository root, run this in PowerShell. The password prompt is hidden; values are temporary process variables rather than saved .env credentials.

```powershell
$env:ADMIN_BOOTSTRAP_EMAIL = Read-Host 'First administrator email'
$adminSetupSecret = Read-Host 'Unique password (15+ characters, at most 72 UTF-8 bytes)' -AsSecureString
try {
    $env:ADMIN_BOOTSTRAP_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSetupSecret).Password
    npm --prefix server run admin:bootstrap
} finally {
    Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ADMIN_BOOTSTRAP_EMAIL -ErrorAction SilentlyContinue
    $adminSetupSecret.Dispose()
}
```

Do not share the password in chat or put it in Git. The command uses the existing backend database configuration. No admin was created and no live database was changed during development.

## Passwords

The current local patient and professional signup routes use salted bcrypt hashes with cost 10; login uses bcrypt.compare. First-admin provisioning uses cost 12. The users.password column contains a hash, despite its column name. Google-only accounts have a null local password; the app does not receive or store the Google password. Existing database rows were not inspected, so this describes the code paths, not an audit of historical data. OWASP prefers Argon2id for new password-storage implementations; migration and MFA are future authentication work.

## Google identity and roles

The backend verifies Google's ID token with google-auth-library and the configured client ID. It requires a verified email and uses the stable Google sub value stored as users.google_id to find a linked user. The role always comes from users.role; a client-provided role or email domain grants no role.

- New Google identity: create a patient account, then patient application/approval.
- Professional applicant: request professional access and complete credential review; account remains pending-doctor until approved.
- Already-linked professional/admin: reuse its existing database role.
- Existing local account with the same email but no matching Google subject: reject automatic linking and require the existing login method. An authenticated account-linking screen is not implemented yet.

Google signup alone never makes a user a doctor or admin. Similar automatic email-based linking was disabled for Facebook to prevent a second path around the same protection. MFA is not yet enforced by this app; Google sign-in by itself does not prove that MFA occurred.

## Verification

`npm --prefix server run test:admin` covers Google identity/role rules, current-role admin authorization, first-admin bcrypt setup, true zero counts, directory pagination, secret exclusion, email retry and audit recording using isolated PostgreSQL. Tests do not read application .env files. Desktop/mobile rendering and navigation were checked using a separate preview containing synthetic data. The saved preview screenshot is not production data. No live SMTP or Google OAuth request was made.

References:
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
