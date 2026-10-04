# Security review — 2026-10-02

## Fixes

1. **Client-controlled Storage URL lifetime.** Student SELECT policies previously permitted direct Storage signing with a caller-chosen expiry, bypassing the API's short lifetime and enrollment expiry cap. Migration `20261002001000_security_hardening.sql` removes these policies and adds restrictive guards for both protected buckets. Students cannot list, download or sign objects using their JWT directly. The media APIs authorize with the user's cookie client and RLS, then use a separate server-only service-role client to sign only the reference read from that authorized lesson. Admin uploads continue to use the admin's cookie client. No service role is used for application queries or authorization.
2. **Database identity checks lagged application checks.** The active-user and admin helpers now also require a confirmed Auth email matching the profile. Unverified identities and mismatched profiles cannot bypass the application through direct database requests.
3. **Unbounded playback request reads.** The progress endpoint now counts bytes while reading, rejects oversized Content-Length, and cancels chunked bodies above 512 bytes instead of buffering the entire request first.
4. **Public-key configuration protection.** Next configuration rejects secret keys and legacy service-role JWTs placed in public environment variables before bundling. Credential values are not included in errors. The privileged signer imports `server-only` and is used only in private-media routes.

## Reviewed boundaries

- Google OAuth uses the Supabase SSR PKCE flow; the callback exchanges the code and computes a fixed local destination. No caller-provided redirect destination or metadata-based role is accepted. Server authorization uses `getUser()`, the database profile, activity status and current grants.
- Every admin mutation checks `requireAdmin()` before processing inputs. RLS or each security-definer admin RPC independently checks the active database admin role. Security-definer functions use an empty search path and explicit schema names. Students cannot edit roles/activity, manage content, issue invitations, or grant/extend/remove course access.
- Course and lesson IDs are validated. Course membership is resolved through stored relations; supplied course/lesson pairs must match. Current publication, grant expiry and sequential prerequisites are enforced by RLS and server checks. Curriculum RPCs expose only safe outline fields for locked lessons.
- Progress is bound to `auth.uid()`. Foreign student IDs cannot change ownership or another student's progress. The progress HTTP endpoint also checks same-origin requests. Next server actions retain their default origin protection.
- PDF/video APIs accept lesson IDs, not object paths, target user IDs, provider URLs, or credentials. Media references are validated; arbitrary HTTP video URLs and path traversal fail closed. Media responses are private/no-store and omit internal errors.
- SQL tests exercise direct access as anonymous, student, other student, inactive and admin roles, including forged identifiers, role escalation, revoked/expired grants, drafts, sequential locks and private storage. These run in real PostgreSQL via PGlite with mocked Supabase Auth/Storage tables; they are not a hosted Storage/OAuth integration test.

## Required deployment steps and limits

Apply **all migrations in filename order**, including migration 010, and deploy the matching application. Set `SUPABASE_SERVICE_ROLE_KEY` in server-only deployment secrets for PDFs and Supabase-hosted videos. Do not put it in any `NEXT_PUBLIC_` variable. Missing configuration fails closed. Bunny-only video playback does not require a Supabase signing key; private PDFs still do.

Keep Google as the intended enabled sign-in provider, configure exact OAuth redirect URLs, and enable email confirmation for any additional provider. Verify hosted bucket privacy and policies after deployment. Do not expose the `private` schema in the Data API. Bootstrap administrators only through trusted database-owner tooling.

Already issued signed links remain bearer capabilities until their original expiration; deleting access cannot recall downloaded files. Newly issued PDFs last at most 300 seconds, and videos 30–900 seconds (default 300), capped by enrollment expiry. Old links minted before this migration may live longer: treat deployment as incomplete until those links have expired or been invalidated with the storage provider. See [Supabase signed downloads](https://supabase.com/docs/guides/storage/serving/downloads) and [signing permissions](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).

Bunny Embed View Token Authentication and protected underlying CDN delivery must be enabled in the actual library. Signed embeds cannot secure otherwise public CDN files. Hosted Google OAuth, Storage delivery, Bunny configuration, and deployment secrets still require live verification; no hosted credentials are present in this workspace. This review does not claim DRM or protection against an authorized student recording or sharing content.

## Local verification

- Full test run: 65 passing test-runner entries, including the database suite with 182 passing security checks.
- Production build and ESLint passed.
- Browser build assets contain no private signing configuration identifiers or server signing client.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities at review time.
- Hosted migrations were not applied and external OAuth/media delivery was not tested.
