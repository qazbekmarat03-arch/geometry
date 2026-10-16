# Security and performance review — 2026-10-16

## Changes
- Upgraded Next.js and matching ESLint config from 16.3.6 to 16.3.8. The npm advisory feed identified six Next.js advisories affecting the previous version. Production dependency audit after patch: zero known vulnerabilities.
- Added anti-framing CSP/X-Frame-Options, object-src restriction, base-uri restriction, nosniff, referrer policy, and camera/microphone/geolocation restrictions. This is a baseline CSP, not a full script nonce policy. YouTube embedding/fullscreen remain permitted.
- Removed one sequential database round trip from dashboard/course data loading by joining published courses through the current user's active, unexpired course_access rows. Existing RLS remains in force.
- Media authorization now runs enrollment and sequential-unlock checks concurrently after resolving the lesson's course. Both must succeed before returning a media reference.
- Subset local fonts to Latin/Cyrillic (including all Kazakh letters), common punctuation and currency. Combined WOFF2 size reduced from 678,776 to 531,124 bytes (147,652 bytes / 21.8%). Original TTF files remain available. No external font requests added.

## Reviewed controls
- Admin server actions call requireAdmin; database functions/policies independently enforce the verified Google owner and database role.
- Course and lesson IDs are validated and enrollment/expiry is checked server-side and in RLS. No shared cache for private data was introduced.
- Private video/PDF URL signing occurs after authorization and uses a server-only client; student Storage SELECT remains restricted to prevent minting long-lived URLs.
- Progress POST uses same-origin validation and a bounded JSON reader. Quiz scoring and answer disclosure occur in database functions, not client input.
- TeX rendering uses bounded KaTeX expansion with trust=false; it does not execute TeX commands or packages.

## Validation
- 95 application tests passed.
- 206 database security checks passed using local PGlite against all migrations.
- 59 quiz/practice database checks passed.
- Production build includes TypeScript validation.
- Before change, one unauthenticated public measurement: landing HTTP 200, TTFB 0.971 s, total 1.574 s; anonymous /admin HTTP 307 to /login. These are single network samples, not a benchmark or a guarantee.

## Limits / follow-up
- Full npm audit still reports five dev-only dependency-chain findings originating in braces <=3.0.3 (ESLint glob parsing). Registry latest was 3.0.3 at review; no patched braces version available. Do not downgrade Next's ESLint config or run untrusted glob patterns to silence this report. Production npm audit --omit=dev reports zero.
- Local RLS tests validate repository migrations, not an attestation that live database policies have never drifted. This review does not perform destructive penetration testing or load testing.
- A previously issued signed media URL can remain usable until its short TTL expires. YouTube video URLs are not DRM and cannot be made secret from an authorized viewer.
- No absolute intrusion/DDoS prevention guarantee. Provider firewall/rate limits and owner account MFA remain separate operational controls.
