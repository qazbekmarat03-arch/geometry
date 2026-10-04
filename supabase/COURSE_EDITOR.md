# Simple course editor

Apply `migrations/20261001000700_curriculum_editing.sql` after migrations 1–6. The application continues to use the signed-in Supabase client, not a service-role key.

- `/admin/courses`: create courses, open an editor, publish/unpublish.
- `/admin/courses/[courseId]`: edit course title/description/publication, add/edit/delete modules, create lessons, and reorder modules/lessons with up/down buttons.
- `/admin/courses/lessons/[lessonId]`: edit title, description, private video reference, duration in seconds, publication, and attach/replace/remove a homework PDF.

New modules and lessons append to their parent. Lessons start unpublished. Creation and ordering RPCs verify the active database admin role, lock the parent, and change positions transactionally. A move swaps adjacent siblings; it cannot move content into a different course or module. Existing RLS protects all other writes, and every page/action performs a server admin check.

Course deletion removes its modules, lessons, access grants and progress through existing foreign-key cascades. Module/lesson deletion similarly removes contained lessons or related progress. Confirmation dialogs state these consequences. Storage objects are intentionally retained when deleting content or detaching a PDF; linked-file RLS prevents new student access after detachment, while already issued signed links remain valid until expiry. Removing orphaned media is a separate maintenance task.

The video field accepts a bare Bunny video UUID (normalized to `bunny://UUID`), `bunny://UUID`, `storage://course-media/path`, or the reserved `vimeo://ID` reference. Public or signed HTTP MP4 URLs and credentials are not accepted. Vimeo playback still requires a future provider adapter; Bunny configuration remains optional. See `VIDEO_SECURITY.md` for provider setup.

The PDF form uses the existing private Storage upload and signing workflow and is scoped to the edited lesson. PDF upload has its own save button; lesson fields use the main Save button. No rich-text CMS, upload transcoder, or video hosting service was added.

Validation: `npm run build`, `npm run lint`, `npm run test:db`, `npm run test:editor`, and `npm run test:homework`. Database tests exercise real PostgreSQL policies, ordering constraints, permissions, and cascading deletes. Hosted Google OAuth and Storage still require the configured Supabase project.
