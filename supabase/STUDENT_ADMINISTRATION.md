# Student administration

Apply `migrations/20260929000500_student_administration.sql` after the first four migrations before deploying this code. No service-role key is needed by the application. Google OAuth and the existing Supabase environment configuration are still required.

`/admin/students` lists registered student profiles, supports name/email search, filters active accounts, and paginates results. Each row shows its course grants and links to `/admin/students/[studentId]`. The detail page supports account activation/deactivation and removal of individual course grants. Confirmation dialogs precede destructive actions. The recent-student and overall count cards continue to count registered profiles only.

## Email pre-authorization

Use **+ Оқушы қосу** to enter a Google email and select a course. Emails are trimmed and lowercased, without provider-specific transformations such as removing dots or plus suffixes. A pending authorization appears below the registered-students list. No email is sent and no fake Auth account is created.

After Google sign-in, the server invokes `claim_student_invitations` with the user's session. The database reads `auth.uid()` and the confirmed email from `auth.users`, compares the stored profile email, and requires an active student profile. Matching invitations create course grants once and record who claimed them. Neither an email nor a user ID is accepted as a claim argument. Existing inactive or expired grants are never silently reactivated. Existing students can also receive a pending grant; it is claimed on their next protected page request.

Pending authorizations can be revoked with confirmation. If sign-in claimed the invitation between loading the page and confirming revocation, its corresponding grant is removed as well. Profile locks serialize this against the claim transaction. A removed grant cannot be recreated from its old invitation on later sign-ins.

## Account revocation

Deactivation changes `profiles.is_active` immediately and clears outstanding, unclaimed invitations for that email. The existing server guards and RLS block subsequent dashboard, lesson, progress, and Storage requests, including requests using an existing session. Activation restores retained course grants; removing one course grant leaves other courses and saved learning progress intact. These operations cannot target admin accounts. Every action checks the active database admin role in both the server action and its database function.

Already issued signed video/PDF URLs remain bearer links until expiration; already downloaded material cannot be recalled. This feature does not claim to revoke those links or erase an already rendered browser page. New signed links are denied immediately after account/course revocation. Instant invalidation of outstanding media links would require a different delivery mechanism that rechecks authorization on each request.

Database function permissions follow the [Supabase database function guidance](https://supabase.com/docs/guides/database/functions): explicit caller checks, empty search paths, and limited execute grants. Run `npm run test:db` and `npm run test:auth` for the authorization regressions.
