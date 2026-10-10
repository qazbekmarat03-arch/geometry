# DURYSTAP Geometry

Kazakh-language geometry learning platform built with Next.js App Router, TypeScript, Tailwind CSS and Supabase. Includes Google login, administrator-managed course access, private lessons/PDFs, learning progress, optional sequential unlocking, and a simple admin editor.

## Requirements and local development

Use Node.js 24 LTS (minimum 22.18) and npm. Install the exact locked dependencies:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell: use `Copy-Item .env.example .env.local` instead of `cp`. Fill in the configuration below and restart the server after environment changes. Open `http://localhost:3000`.

Without configuration the landing page works, Google login is disabled, protected pages redirect to login, and private-media APIs fail closed. There are no seeded users, courses, or progress records. The landing curriculum is the requested static public course description, not database/demo enrollment data; maintain its copy when the actual course syllabus changes.

## Environment variables

Local development uses the same session and database permission checks as production. Sign in with Google using an active account with the required course access (or an administrator role).

| Variable | Required for | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Authentication and database access; project URL from Supabase | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Authentication and database access; publishable key, never service role | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Private PDFs and Supabase-hosted video signing | Server only |
| `VIDEO_PROVIDER` | `supabase` (default) or `bunny`; unknown providers fail closed | Server only |
| `VIDEO_PLAYBACK_TTL_SECONDS` | Optional integer 30–900; default 300 | Server only |
| `BUNNY_STREAM_LIBRARY_ID` | Numeric library ID when using Bunny | Server only |
| `BUNNY_STREAM_TOKEN_KEY` | Bunny Embed View Token Authentication key when using Bunny | Server only |

Keep `.env.local` out of source control. Use your deployment provider's secret settings in production. Never prefix service/Bunny secrets with `NEXT_PUBLIC_`; the build rejects known privileged public credentials. Public variables are included during the build: rebuild when they change. Google client ID/secret belong in Supabase's provider settings, not this application's environment.

## Supabase setup

1. Create a project and copy its URL and publishable key into `.env.local`.
2. Apply **all SQL files** in `supabase/migrations/` once, in filename order, using the Supabase SQL Editor as the database owner. For an existing project, apply only pending migrations after a backup. Include `20261002001000_security_hardening.sql` and `20261004001100_single_google_admin.sql`.
3. Keep `private` out of the Data API's exposed schemas. Check that RLS is enabled on application tables and that the `homework` and `course-media` buckets are private.
4. Set the server-only service-role key for private-media signing. All authorization and ordinary database queries use the signed-in user's client and RLS. The privileged client only signs the lesson reference after authorization succeeds.

For the Supabase CLI workflow, initialize local CLI configuration once with `supabase init`, then `supabase login`, `supabase link --project-ref YOUR_PROJECT_REF` and `supabase db push`. Choose either SQL Editor or tracked CLI migrations; reconcile migration history before switching workflows. The repository does not automatically migrate a hosted database at startup/build.

See [database setup and policies](supabase/README.md) and the [security review](supabase/SECURITY_REVIEW.md).

## Google OAuth configuration

1. In Google Cloud, configure the OAuth consent screen and create an OAuth client of type **Web application**. This app uses only basic identity scopes (email/profile); Google exempts these sign-in requests from the Testing-mode test-user allowlist and seven-day authorization expiry. If additional scopes are introduced, review Google's testing and verification requirements before enabling them. Complete production branding and domain configuration before launch.
2. Set its authorized redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback` (or the exact callback shown by your Supabase project). This is the Google-to-Supabase callback.
3. In Supabase Authentication → Providers, enable Google and save the Google client ID and secret. Keep other login providers, anonymous sign-in and manual identity linking disabled. Google client secrets must stay in Supabase, never in browser code.
4. In Supabase Authentication → URL Configuration, set Site URL to your application's production HTTPS origin. Add the exact application callbacks: `http://localhost:3000/auth/callback` for local development and `https://YOUR_DOMAIN/auth/callback` for production. Avoid broad production wildcards.
5. Restart/redeploy, then test actual Google login. The app exchanges the PKCE code at `/auth/callback` and routes to `/admin`, `/dashboard`, or `/access-denied` based on database permissions. No arbitrary return URL is accepted.

Official references: [Google with Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls), and [Google app audience and basic identity scope exception](https://support.google.com/cloud/answer/15549945?hl=en).

## Sole administrator

The only administrator is **qazbek03@gmail.com**. After applying migration `20261004001100_single_google_admin.sql`, sign in with that Google account. The server calls the argument-free `claim_owner_admin()` RPC, which verifies the current Auth user's confirmed email and verified Google identity inside the database before assigning the role. The account then opens `/admin` without needing a course grant.

No manual UUID update or service-role key is required for administrator login. The migration demotes previous administrators with other identities. Database policies and a profile trigger prevent other accounts from becoming administrators, including via direct API calls. Inactive accounts remain inactive. The email in browser input or user metadata cannot grant access. Other users are students and still need administrator-issued course access.

If Google login is disabled, fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, then restart the development server (or rebuild the deployment). If Google refuses the redirect, check both callback URLs in the configuration above. If the owner sees access denied, verify migration 011 was applied and the profile is active. If the callback fails locally, also check that the server process can reach Supabase over HTTPS.

## Course and student setup

- `/admin/courses`: create a course, modules and lessons. Set lesson descriptions, duration in seconds, protected video references, publication and optional sequential unlocking. Publish both the course and intended lessons.
- Attach PDF homework in the lesson editor or `/admin/homework`; maximum 10 MiB. Uploads use an authenticated administrator and Storage RLS.
- `/admin/students`: pre-authorize an email with **+ Оқушы қосу**, choosing a course. The verified matching account claims this administrator-issued invitation on sign-in.
- For registered students, open their details to grant, renew or remove course access. Choose no expiry, 30/60/90 days or a custom inclusive Kazakhstan date. Deactivation blocks the whole account. Course grants do not reactivate an inactive account.
- Students see only published assigned courses. Sequential courses require completing all earlier published lessons. Progress writes always use the authenticated user's ID.

No-grant accounts see **Қолжетімділік жоқ** with their email and account-switch button. Expired/revoked grants block subsequent page, API and database requests without a scheduled job.

## Private media

For Supabase video, upload with trusted administrator tooling to private `course-media` and store `storage://course-media/<path>` in the lesson. Admin PDF upload creates its reference automatically. Public MP4 URLs are rejected. Students cannot sign/download Storage objects directly; the lesson APIs enforce access and return short-lived signed URLs capped by enrollment expiry.

For Bunny, configure the library and token key, enable Embed View Token Authentication, and protect underlying CDN delivery before publishing. Store a video UUID or `bunny://UUID` in the editor. The player has native/Bunny playback-position handling and a resume prompt; verify the actual Bunny SDK and library in staging. Vimeo references are reserved but playback is not implemented.

Signed links are bearer permissions until their original expiry, even after later revocation. Previously downloaded/buffered media cannot be recalled. Old links issued before migration 010 may last longer and require expiry or provider invalidation. This is access control, not DRM.

See [video setup](supabase/VIDEO_SECURITY.md), [PDF setup](supabase/HOMEWORK.md), and [playback progress](supabase/PLAYBACK_PROGRESS.md).

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Type checking generates Next route types first, so it works on a fresh checkout. Tests use Node's test runner and isolated PostgreSQL via PGlite; no test fixtures are inserted into your hosted database. Individual suites are available as `test:db`, `test:auth`, `test:video`, `test:homework`, `test:dashboard`, `test:editor`, `test:media`, and `test:security`.

Read [production readiness results and the 18-scenario checklist](PRODUCTION_READINESS.md). Local tests do not substitute for hosted Google OAuth, cookie/session refresh, PostgREST, private downloads or real video playback. Finish the staging checklist with separate admin, authorized-student and unauthorized accounts before launch.

## Production deployment

Use a Next.js-capable host or a Node server. Static export is unsuitable: authentication, server actions and private media require a server. See [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying).

1. Configure the production Supabase project, pending migrations, Google provider and exact HTTPS redirects. Use a separate project for staging/testing.
2. Set the public variables at build time and private secrets in the runtime environment. Keep the service-role key available only to the server.
3. Install with `npm ci`, run the validation commands, and build with `npm run build`. On managed hosting select the Next.js preset. On a Node host run `npm start` under a process manager/container, with HTTPS terminated by a trusted reverse proxy.
4. Preserve the original host/origin and cookies through the proxy; do not cache authenticated pages or `/api/lessons/*`. Keep Next's server-action origin checks enabled. Ensure the host supports the PDF action's 12 MB request limit; some hosts have smaller limits, so verify a representative upload before launch.
5. Bootstrap the admin, add real course content, and run all staging scenarios. Check invalid/expired media links and direct ungranted URLs as well as the happy path. Configure database backups and monitor server/authentication failures without logging tokens or signed URLs.

Missing credentials do not make the build fail: this supports previews, but a successful build alone does not mean production is configured. No deployment or hosted migration is performed automatically by this repository.

## Structure

```text
src/app/(public)/            Landing page
src/app/(auth)/              Login and access-denied pages
src/app/(student)/dashboard/ Student courses, lessons, progress and profile
src/app/(admin)/admin/       Student/access management and course editor
src/app/auth/               OAuth callback and logout
src/app/api/lessons/         Protected video, PDF and playback endpoints
src/components/             Shared UI, navigation, student/admin components
src/lib/                    Authorization, queries, providers and validation
supabase/migrations/        Schema, indexes, functions and RLS
scripts/                    Isolated regression tests
```

The application intentionally excludes payments, complex analytics and a general-purpose CMS.

## YouTube lessons

Admin → Courses → module → lesson editor accepts a YouTube watch/share/shorts URL or an 11-character video ID. Save and publish the lesson. YouTube embedding must be enabled; a private video will not play for students without YouTube's own permission. No YouTube API key or service-role key is required. YouTube lessons can coexist with the configured private video provider.

The existing server and RLS checks still protect lesson pages, video API, and progress. YouTube itself does not issue expiring playback URLs: public/unlisted video links can be copied and watched outside the platform, even after platform access is revoked. Use Bunny signed playback for provider-enforced expiry. Playback position uses the official YouTube IFrame API and the existing 20-second/paused/page-exit persistence flow.

Teacher portrait: `public/images/qazbek.png`, displayed with Next Image. Replace this file to update the portrait. Testimonials must be supplied by real students with permission; no fabricated endorsements are published.

## Current Vercel production setup

The deployed site is `https://geometry-sigma.vercel.app`. GitHub stores source code; ignored `.env.local` values do not transfer to Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment before rebuilding/redeploying. These public settings must reference the same Supabase project as the applied migrations. Google client secrets belong only in Supabase, never in public variables.

In Supabase Authentication → URL Configuration, production requires Site URL `https://geometry-sigma.vercel.app` and the exact allowed redirect `https://geometry-sigma.vercel.app/auth/callback`. Keep `http://localhost:3000/auth/callback` for development. Do not allow all Vercel domains via a wildcard. Google Cloud keeps the Supabase `/auth/v1/callback` URI; the browser-facing app callback is configured in Supabase. A disabled Google button means the deployed app is missing its Supabase configuration, not that Google must be bypassed.


## Google Drive homework import

Admin → lesson editor → Homework → Google Drive link. Paste a PDF file link (`drive.google.com/file/d/…/view` or `/open?id=…`) and optionally give it a name. Temporarily enable viewer/download access for anyone with the link in Drive. The server validates Google-only redirects, limits the download to 10 MiB/20 seconds, checks the PDF header and copies the bytes into the existing private homework bucket. Google Docs/folders, HTML confirmation pages and restricted files are rejected. A failed import preserves the old homework.

After saving, Drive sharing can be closed again. Students receive only the platform's short-lived authorized Storage URLs; they never receive the original Drive link. Drive edits are not synced: import the updated file again. `SUPABASE_SERVICE_ROLE_KEY` remains required **server-side only** for student PDF signing, as for ordinary file uploads. No new migration is needed.

## Request latency

Invitation/owner claims run only at the verified OAuth callback. Protected requests still check the authenticated identity, current profile and active/unexpired grant on every request. No permission results are cached across users or requests. A lesson page loads only its own course curriculum, rather than every enrolled course. `vercel.json` puts server functions in `bom1`, alongside the Supabase Mumbai database; update this if the database moves. Protected sidebar links do not prefetch unopened pages, reducing parallel permission/database requests. Decorative WebGL remains isolated to the public landing page.

Landing result cards transcribe teacher-provided 2025 UNT scores using first names only; original documents with personal identifiers and QR codes are not published. No fabricated student quotations are included.

Display/body fonts ship as WOFF2 subsets covering Latin, Cyrillic (including all Kazakh letters), punctuation and common mathematical symbols. Original font licenses remain in `public/fonts`.


## Native quiz homework

Apply migration `20261009001300_lesson_quizzes.sql` before deploying. In the admin lesson editor choose PDF, quiz, or both. Paste the bounded TeX format shown in the editor, preview, then save. Supports 1–100 numbered questions, four A–D options, one answer and a worked solution for each. Math is rendered with KaTeX; the supported declarative TikZ subset renders as SVG, without executing TeX or external commands. Check diagrams in the preview; arbitrary TeX packages are not supported.

Quiz lessons require strictly more than 80% (41/50) to complete and unlock later published lessons, including in freely navigable courses. PDF-only lessons retain normal completion behavior. Correct answers persist; retries contain only remaining questions. Solutions become visible after two wrong attempts on that question. Students may continue retrying after passing. Changing the test or mode invalidates old results and resets completion when a quiz is required. Answer keys/source are admin-only; grading, prerequisites and completion guards are enforced in PostgreSQL. Do not commit real answer keys: `*.private.tex/json/sql` are ignored.

Run `node scripts/test-quiz-database.mjs` for scoring, retry, expiry, role and prerequisite security checks.
