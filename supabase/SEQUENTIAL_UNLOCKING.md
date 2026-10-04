# Optional sequential lesson unlocking

Apply `migrations/20261001000900_sequential_unlocking.sql` after migrations 1–8. Existing courses default to `lesson_unlock_mode = 'all'`. Choose **Барлық сабақтар ашық** or **Кезекпен ашылады** in the admin course editor.

Sequential order is module position followed by lesson position. Only published lessons participate. The first published lesson is available immediately; later lessons require all preceding published lessons to be completed by the current student. This keeps the sequence intact after reordering, publishing an earlier lesson, or changing an existing course from all to sequential. Changing back to all opens every published lesson. Completion history is retained.

`private.can_access_lesson` checks publication, current active/unexpired enrollment, active account, and prerequisites. Lesson SELECT RLS uses it, so student requests cannot retrieve locked lesson descriptions or media references. Progress write policies depend on visible lesson rows, blocking direct completion/playback writes for locked lessons. Migration 010 blocks all direct student Storage signing; the media APIs check lesson access before using the private server signer. The server also calls the permission RPC before serving a lesson or signing media. Admin editing remains available through the existing admin policy.

The separate `get_course_curriculum` RPC exposes a safe outline to an enrolled student: published lesson titles, duration, order, lock flags, and the student's own progress. Locked descriptions are redacted; video and homework paths are never in its return shape. This lets the curriculum show locked items with **Алдыңғы сабақты аяқтаңыз** without weakening lesson RLS. Locked items have no links; resume and recent-lesson links exclude them. Course progress continues to measure the entire published curriculum of the granted course, including lessons yet to unlock, rather than reaching 100% after the first unlocked lesson.

Mode/publication/order changes are evaluated on subsequent requests. Previously issued signed media links retain their original expiry; this limitation is unchanged.

Verified by `npm run test:db`, `npm run test:dashboard`, and `npm run test:video`: first lesson, drafts, module boundaries, per-student completion, reordering, mode changes, expiry, safe outline redaction, direct progress bypass attempts, and private media access. Hosted authenticated UI/provider verification requires configured Supabase credentials.
