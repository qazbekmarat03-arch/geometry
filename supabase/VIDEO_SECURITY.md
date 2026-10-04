# Video playback boundary

`VideoPlayer` receives only a lesson UUID and progress information. It requests `GET /api/lessons/[lessonId]/video` with the current session cookies. Pages, React props, and dashboard queries no longer contain playable video URLs. The API authorizes with a cookie-scoped Supabase client and RLS. Only signing uses a separate server-only service-role client.

Before issuing playback, the server verifies the user with `auth.getUser()`, their confirmed email and active database profile, the published lesson and parent course, and an active unexpired grant for that exact course. Course identity comes from the database join. Supabase RLS independently protects the reads. Admins also need a course grant when using this student playback API.

Successful JSON contains only `provider`, `kind`, `url`, and `expiresAt` (Unix seconds). Responses, including failures, use `Cache-Control: private, no-store`. There are no signed URL logs, public caches, API keys in responses, user-controlled provider URLs, or open-redirect parameters. HTTP(S) video references are rejected; the general homework resolver is never used for videos.

## Environment

All provider configuration is optional and server-only. Never add a `NEXT_PUBLIC_` prefix to these variables.

```dotenv
SUPABASE_SERVICE_ROLE_KEY=
VIDEO_PROVIDER=supabase
VIDEO_PLAYBACK_TTL_SECONDS=300
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_TOKEN_KEY=
```

Absent `VIDEO_PROVIDER` defaults to private Supabase Storage. `disabled` or an unknown provider returns an unavailable state; it never falls back to a public URL. TTL must be an integer from 30 through 900 seconds and is shortened to the grant expiration if sooner. Missing keys, malformed IDs, invalid TTL, and signing failures fail closed. No provider credentials are required to build the application.

## Private Supabase playback

Store `storage://course-media/<course UUID>/<lesson UUID>/video.mp4` in `lessons.video_url`. The private bucket and its RLS policies are created by the second migration. Apply migration 010 to block direct student Storage access. Set the server-only SUPABASE_SERVICE_ROLE_KEY. The API authorizes the lesson under the student's session, then uses the server signer; the resulting file URL is temporary, not a public Storage URL. Students cannot upload or change media mappings. Upload through trusted administrator tooling.

## Bunny Stream

1. Set `VIDEO_PROVIDER=bunny`, the numeric library ID, and the library's **Embed View Token Authentication key** in `BUNNY_STREAM_TOKEN_KEY`. This is not the management/upload API key.
2. In Bunny, enable **Embed View Token Authentication**. Configure the underlying CDN/file security too: restrict allowed embed domains, disable unnecessary MP4 fallbacks, and protect direct video delivery with the appropriate CDN token/MediaCage settings. A signed iframe alone does not make an otherwise public CDN file private.
3. Store `bunny://<video UUID>` in `lessons.video_url`. No API key, library secret, or playback URL belongs in that table.
4. Test that unsigned/expired embed requests and unauthorized direct file requests are denied in the actual Bunny library before publishing the course.

The adapter produces Bunny's documented SHA256 hex signature over `token_security_key + video_id + expires`, and returns a short-lived player embed URL. The iframe supports explicit lesson completion. Native-file and Bunny Player.js events support position saving and resume; actual SDK/library behavior still needs hosted verification. The refresh button repeats server authorization and requests a new token.

Sources: [Bunny embed token signing](https://github.com/BunnyWay/documentation/blob/main/stream/token-authentication.mdx), [Bunny's two security layers](https://github.com/BunnyWay/documentation/blob/main/stream/security.mdx).

## Future Vimeo adapter

Implement the `VideoProvider.createPlayback` contract in `src/lib/video/provider.ts` and register the adapter. It must produce provider-enforced time-limited playback after the same API authorization. `vimeo://<id>` is reserved in the schema, but choosing Vimeo currently fails closed. Do not implement Vimeo support as a permanent public/unlisted iframe and call it signed playback.

## Apply and verify

Apply `20260929000300_video_references.sql` after the preceding migrations. It rejects new public video URLs at the database level. If existing lessons contain HTTP(S) URLs, migrate those rows to private/provider references first: the migration intentionally fails rather than discarding those values or leaving a bypass. Remove public copies at the old hosting provider as part of that migration; changing the database cannot revoke a previously public file.

Run `npm run test:video`, `npm run test:db`, `npm run build`, and `npm run lint`. Local tests cover signing, expiry bounds, missing configuration, public-URL rejection, authorization, and RLS. Live Bunny/Supabase delivery still needs the external configuration and actual media.

Signed URLs are temporary bearer permissions: a recipient can reuse/share one until it expires, and already buffered video may continue after expiry. Revocation prevents new tokens; it does not recall an issued token. Authenticated users can still record or capture playable media. This architecture is access control, not DRM or a promise to prevent downloads. No CSS hiding, disabled context menus, or concealed player controls are used as security.
