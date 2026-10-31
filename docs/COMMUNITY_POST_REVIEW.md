# Community post review

Administrators can open **Community posts** in the admin sidebar to review pending submissions. They can inspect the author, caption, image and location, add an optional internal review note, and approve or reject the post. Approved and rejected filters show previous decisions. Lists have 25 posts per page.

New submissions remain pending until approval. The patient form confirms submission instead of adding pending content to the public feed. Existing published posts remain approved when upgrading. Both community feed APIs exclude pending/rejected posts, and comments/reactions cannot target hidden posts. The older post creation endpoint requires an authenticated, approved patient and also creates pending submissions.

Review endpoints use the existing administrator authentication and current-role checks. Decisions update only pending posts, preventing a second administrator from overwriting a completed review. The decision and audit event commit in the same transaction.

## Activate the feature

Apply the additive migration before starting the updated backend. Using the existing configuration in `server/.env`, run from the repository root:

```sh
node --env-file=server/.env server/migrations/runMigrations.js
```

If the deployment supplies environment variables directly, the existing `npm --prefix server run migrate:postgres` command also works. Migration `009_community_post_review` adds moderation metadata to posts; earlier migration files are unchanged. Use the existing encryption key required by the migration runner, rather than generating a replacement.

The migration was tested against an isolated PostgreSQL-compatible database. It has **not** been applied to the database configured in `server/.env`, which is remote. The normal environment loader currently references a missing legacy environment-file path, so explicit environment loading is needed for the command above. No environment files were edited for this feature.

## Verification

- 18 focused migration, access, administrative review and registry checks passed.
- All 24 existing Jest API/model/service tests passed.
- The complete Node suite passed 72 of 73 checks. The unchanged `profilePhoto.test.js` test for rejecting truncated PNGs fails; the profile-photo implementation and test were not edited.
- A production bundle compiled successfully with Rollup tree shaking disabled for verification. The standard optimization step stalled; build configuration was not changed as part of this feature.
- A browser preview using synthetic posts verified approval, rejection, pending counts, review notes, and approved-history views without console errors. No actual community content was changed during preview testing.
