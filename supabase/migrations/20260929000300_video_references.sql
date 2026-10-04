begin;
-- Store identifiers, never public/signed playback URLs or provider credentials.
-- Existing HTTP(S) rows must be migrated to private references before applying.
alter table public.lessons add constraint lessons_video_reference check (
  video_url is null
  or video_url ~ '^storage://course-media/.+'
  or video_url ~* '^bunny://[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  or video_url ~ '^vimeo://[0-9]+$'
);
comment on column public.lessons.video_url is
  'Provider reference only: storage://course-media/path, bunny://video-uuid, or reserved vimeo://id. Playback URLs are created server-side after authorization.';
commit;
