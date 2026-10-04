# Production readiness — 2026-10-02

**Local checks pass. Production sign-off is pending hosted integration tests.** The workspace has only `.env.example`; Google login is correctly disabled without Supabase configuration. No hosted migrations or deployment were performed, and no authentication bypass was added for testing.

## Checks and cleanup

- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- `npm test`: 64 passing runner entries, including the database suite; 184 PostgreSQL security/behavior checks.
- Additional TypeScript unused-local/parameter checks passed. Installed direct dependencies match the manifest; each is used by the app, framework, tooling, or tests, so none was removed speculatively.
- Removed the obsolete dashboard shell, unused public-media resolver, duplicate unreachable admin student/course list branches, and permanently hidden legacy logout forms. Removed the decorative fake slide counter.
- No application debug console logs or seeded users/courses/progress were found. Isolated test fixtures remain under `scripts`; they never populate the application or hosted database. Input hints and the requested static public syllabus are intentional content.
- Added `npm test`, fresh-checkout Next route type generation, and an explicit supported Node version. Rewrote README setup/deployment instructions.

## Requested scenarios

“Automated” below means isolated database or mocked service/model tests, **not** completed Google/browser integration.

| # | Scenario | Result / evidence | Hosted verification remaining |
| --- | --- | --- | --- |
| 1 | Visitor opens landing | Passed in production browser and HTTP (200) | Confirm production domain/assets |
| 2 | Visitor clicks login | Passed: mobile navbar link opens `/login` | Google initiation requires credentials |
| 3 | Unauthorized Google account | Automated: no grant / forged role metadata returns denied | Real Google callback, email and account-switch screen |
| 4 | Authorized student logs in | Automated: verified active identity and grant allowed | Real Google session/cookie flow |
| 5 | Only assigned courses visible | PostgreSQL RLS and dashboard tests passed | Check rendered course list with two accounts |
| 6 | Allowed lesson opens | Lesson publication, grant and sequential authorization tests passed | Browser page and actual video playback |
| 7 | Manually entered unauthorized lesson | Cross-course/other-student/locked IDs denied in tests; anonymous manual lesson URL redirects to login in browser | Repeat with signed-in student and another course ID |
| 8 | Authorized homework download | Reference/filename validation and shared lesson authorization tested; direct student Storage access blocked | Upload a real PDF and download through the signed API |
| 9 | Complete lesson | PostgreSQL completion RPC and ownership tests passed | Click button in authenticated browser |
| 10 | Progress updates | Completion counts/percentages, playback samples and database ordering tests passed | Confirm dashboard after completion and resume after reload |
| 11 | Admin logs in | Database role/active checks passed; anonymous `/admin` redirects to login in browser | Real admin Google callback |
| 12 | Admin authorizes email | Invitation issuance, verified claim and revoke tests passed | Submit student form and sign in as that email |
| 13 | Admin grants access | Grant/renewal modes and role checks passed | Submit access form and reload student's course list |
| 14 | Admin revokes access | Grant removal and invitation non-reclaim tests passed | Confirm destructive dialog and submit |
| 15 | Revoked student cannot open lessons | PostgreSQL visibility and media authorization tests passed | Reopen bookmarked lesson in existing browser session |
| 16 | Access expires | Past/equal-now expiry denies course, lesson and progress; signing TTL tests passed | Verify across a short real expiry window |
| 17 | Admin creates/edits modules/lessons | Create, persist edits, reorder and unauthorized mutation tests passed | Full editor form and PDF upload in browser |
| 18 | Mobile layout | Public landing checked at 320, 390, 768 and 1440px without horizontal overflow; mobile menu opens/closes; phone login inspected | Authenticated student/admin content with realistic long titles/tables |

Production preview also returned 404 for unknown pages, sent failed callbacks to `/login?error=auth`, and returned non-cacheable 503 responses for unconfigured video/PDF APIs. Protected App Router pages may send streamed HTTP 200 followed by a redirect; browser verification confirmed `/login`, rather than treating HTTP 200 as proof of access. Browser error log was empty during the public checks.

## Staging sign-off procedure

Use a separate configured Supabase project with all migrations including 010, private buckets, exact OAuth redirects and server-only signing secrets. Use three real Google accounts: an admin, an assigned student and an unassigned account. Do not share credentials in chat or disable RLS.

1. Sign in with the unassigned account: verify the denied page displays the correct email and switching accounts works. Sign in as admin and confirm regular students cannot open admin pages or invoke admin actions.
2. Create two courses with modules and published/draft lessons. Add a real protected video and PDF. Grant the student only course A, first via pre-authorized email and then via the registered student's access controls. Verify that course B and its lesson URLs remain unavailable.
3. Open course A, play/pause/resume, download homework, complete a lesson, and reload the dashboard/progress page. Verify percentages and sequential unlocking. Use a second student to confirm ownership isolation.
4. Revoke course A in the admin session while the student remains signed in. Reload/open bookmarked lessons and request new media URLs; they must be denied. Previously issued signed URLs remain valid only until their original expiry. Repeat with an expiration set a few minutes ahead through trusted staging database tooling.
5. Test module/lesson creation, editing, reordering, publication, PDF replacement, and deletion confirmations. Check mobile navigation and long content on student/admin pages at phone/tablet sizes.
6. Verify unsigned/expired media links, Google logout/account switching, session refresh, and a representative PDF upload within the hosting provider's body-size limits. Run the same checklist against the production domain before opening enrollment.

The README contains configuration details and links to official setup documentation. Completing these hosted checks is required before calling the platform production-ready.
