begin;
-- Accept the canonical YouTube IDs emitted by the lesson editor.
-- This changes reference validation only; all authorization/RLS stays intact.
alter table public.lessons drop constraint lessons_video_reference;
alter table public.lessons add constraint lessons_video_reference check (
  video_url is null
  or video_url ~ '^storage://course-media/.+'
  or video_url ~* '^bunny://[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  or video_url ~ '^vimeo://[0-9]+$'
  or video_url ~ '^youtube://[A-Za-z0-9_-]{11}$'
);
comment on column public.lessons.video_url is
  'Canonical provider reference: storage://course-media/path, bunny://uuid, vimeo://id, or youtube://11-character-id. Lesson access is authorized server-side. YouTube URLs remain shareable outside the platform and do not expire.';
commit;
