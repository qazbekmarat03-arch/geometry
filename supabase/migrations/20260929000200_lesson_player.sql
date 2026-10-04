begin;
-- Atomic, monotonic completion. All checks use the authenticated database user.
create function public.save_lesson_progress(target_course uuid, target_lesson uuid,
  playback_seconds integer default null, mark_completed boolean default false)
returns void language plpgsql security invoker set search_path = ''
as $$
declare lesson_duration integer;
begin
  if not private.has_course_access(target_course) then
    raise exception 'Course access denied' using errcode = '42501';
  end if;
  select l.duration into lesson_duration
  from public.lessons l join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
  where l.id = target_lesson and c.id = target_course and l.is_published and c.is_published;
  if not found then raise exception 'Lesson access denied' using errcode = '42501'; end if;
  if playback_seconds is not null and (playback_seconds < 0 or playback_seconds > 2147483646) then
    raise exception 'Invalid playback position' using errcode = '22023';
  end if;
  if playback_seconds is not null and lesson_duration > 0 then playback_seconds = least(playback_seconds, lesson_duration); end if;
  insert into public.lesson_progress(user_id, lesson_id, completed, video_progress)
  values (auth.uid(), target_lesson, coalesce(mark_completed, false), coalesce(playback_seconds, 0))
  on conflict (user_id, lesson_id) do update set
    completed = public.lesson_progress.completed or excluded.completed,
    video_progress = case when playback_seconds is null then public.lesson_progress.video_progress else excluded.video_progress end;
end;
$$;
revoke all on function public.save_lesson_progress(uuid,uuid,integer,boolean) from public, anon;
grant execute on function public.save_lesson_progress(uuid,uuid,integer,boolean) to authenticated;

-- Media references: storage://course-media/<course UUID>/<lesson UUID>/file.mp4
insert into storage.buckets(id,name,public) values ('course-media','course-media',false)
on conflict (id) do update set public = false;
create policy course_media_admin on storage.objects for all to authenticated
using (bucket_id = 'course-media' and (select private.is_admin()))
with check (bucket_id = 'course-media' and (select private.is_admin()));
create policy course_media_student_read on storage.objects for select to authenticated
using (bucket_id = 'course-media' and exists (
  select 1 from public.lessons l join public.modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  where c.is_published and l.is_published and private.has_course_access(c.id)
  and (l.video_url = 'storage://course-media/' || storage.objects.name
    or l.homework_pdf_url = 'storage://course-media/' || storage.objects.name)
));
commit;
