# Lesson completion and playback resume

Apply all migrations, including `20261001000800_playback_resume.sql`. It adds a playback snapshot timestamp and a user-scoped RPC that ignores out-of-order snapshots. No service-role key or scheduled job is needed.

Students mark lessons complete with **Сабақты аяқтадым**. The completion action resolves the authorized course/lesson server-side; its RPC uses `auth.uid()`. Completion does not overwrite playback position. RLS prevents reading, inserting, updating, or upserting another student's progress, even when both students have access to the same lesson.

Course percentages count completed published lessons divided by accessible published lessons, rounded to a whole percentage (12/30 = 40%). Empty courses show 0%. The curriculum distinguishes completed, current, and incomplete lessons. The dashboard displays **Соңғы тоқтаған жерден жалғастыру** and uses accessible recent playback or manual completion records.

The player offers a saved-time resume button (for example 18:43) and a start-over button. Native playback and configured Bunny embeds report position. Bunny uses its [official Player.js integration](https://bunny.net/blog/introducing-player-js-support-for-bunny-stream-advanced-player-control-and-monitoring-api/), loaded only for Bunny videos; Vimeo remains an unimplemented provider.

Time events only update an in-memory reference. Network saves happen every 20 seconds while the integer position changes, plus pause, ending, visibility-hidden, pagehide, and component cleanup. Small same-origin keepalive POSTs continue during navigation when the browser permits. Duplicate positions are skipped. Playback is stored in `lesson_progress.video_progress`; later snapshots may move backwards after a seek, and older requests cannot overwrite newer snapshots. The API independently checks authentication, active account, published lesson, and active/unexpired course access. The database checks again, scopes to `auth.uid()`, and clamps known durations.

Closing a browser or losing power cannot guarantee a final request. The periodic save provides an approximately 20-second fallback. No request is made for a never-played video merely because it was opened. Provider SDK failures and failed saves show visible messages. Already downloaded media and signed URL expiry retain the limitations documented in VIDEO_SECURITY.md.

Tests: `npm run test:dashboard`, `npm run test:db`, `npm run test:video`, and `node --experimental-strip-types --test scripts/test-playback.mjs`. Real Google OAuth, private Storage, and Bunny event delivery require configured provider credentials for end-to-end testing.
