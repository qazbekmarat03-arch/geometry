# Lesson media setup

Apply `20260929000200_lesson_player.sql` after the platform schema migration. It creates the private `course-media` bucket, admin-only media write policies, student read policies, and an atomic progress RPC. No hosted project was modified by adding this file.

Upload videos and PDFs through Supabase Storage using an administrator account. Store references in the lesson row:

```text
video_url: storage://course-media/<course-id>/<lesson-id>/video.mp4
homework_pdf_url: storage://course-media/<course-id>/<lesson-id>/homework.pdf
```

The object path after the bucket name must exactly match the uploaded object. The server signs only the selected authorized lesson's references. After migration 010, Storage RLS blocks direct student access; the server authorizes the stored lesson reference before using its private signer. Unlinked objects are inaccessible to students. Video URLs now come from the secure lesson API with a default five-minute lifetime; homework now uses a separate authorized API with a five-minute maximum. Existing issued URLs remain usable until expiration after revocation. Use the video refresh button to re-authorize. See VIDEO_SECURITY.md.

Public HTTPS video URLs are no longer supported. Homework must also use private Storage; see HOMEWORK.md. Private Supabase files use the native player; the optional Bunny adapter uses its signed embed player. Vimeo is an extension point, not an implemented provider. Externally hosted files must have their own access controls; application RLS cannot protect a publicly hosted URL. Prefer private Supabase media. See [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

All published lessons in an accessible course are available in order; there is no sequential-unlock rule. The curriculum groups by module. Current and completed states come from the selected lesson and saved progress. Modules without visible published lessons show a disabled locked placeholder; unpublished titles and IDs are never fetched through a privileged client or exposed to students.

The server validates UUIDs, the authenticated user's active grant, course publication, lesson publication, and actual lesson/module/course membership before returning media or accepting a progress action. The database RPC repeats membership and grant checks using `auth.uid()`, and uses RLS. No browser-supplied user ID is accepted. Playback saves approximately every 15 seconds and on pause/end; an abrupt tab close may lose the last unsaved interval. Completion is explicit and never reset by an overlapping playback save. The player resumes from the last saved position; all-complete courses can be revisited.

Run `npm run test:db`, `npm run test:media`, and `npm run build`. Database tests exercise both migrations with mocked Supabase Auth/Storage scaffolding in PostgreSQL, including forged course IDs, cross-course lesson IDs, expired grants, private objects, and completion preservation. Live OAuth, hosted Storage signing, file delivery, and browser playback require a configured Supabase project and actual media for integration verification.
