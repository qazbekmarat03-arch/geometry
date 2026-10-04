# Course access management

Apply `migrations/20260929000600_course_access_management.sql` after migrations 1–5 before using the new course controls.

The student's admin detail page lists all courses, including drafts, with access status, expiration time, grant/edit and remove buttons. Granting access supports no expiration, 30/60/90 days, or a custom date. A renewal replaces the previous expiration; preset durations begin at the database transaction's current time. Custom dates include the entire selected day in `Asia/Almaty`, expiring at the following midnight. Past dates and invalid modes are rejected by the database. Removal requires confirmation and preserves learning progress.

The server action verifies the active admin role, validates identifiers and calls `admin_set_course_access` with the signed-in user's cookie client. The RPC independently verifies the active admin, confirms the target is a student and the course exists, and atomically updates the unique user/course grant. Explicit grants/removals clear old invitations for that course so they cannot undo the new decision. Granting a course does not activate an inactive account or publish a draft course.

No scheduled job is required for expiration. Existing `private.has_course_access` policies require an active account, active grant, and `expires_at IS NULL OR expires_at > now()`. This applies to courses, lessons, learning progress and new Storage requests. Server-side dashboard/course queries and video/homework APIs also check the expiration. Signed media links are capped by grant expiration when issued. A subsequent admin removal or shortened expiration cannot recall previously issued bearer links before their original expiry or already downloaded files.

Run `npm run test:db`, `npm run test:auth`, and `npm run test:video` to verify database expiration, role restrictions, renewal, removal, retained progress, and signed playback limits. Hosted OAuth/Storage integration still requires a configured Supabase project.
