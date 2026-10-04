begin;
alter table public.lesson_progress add column playback_saved_at timestamptz not null default '-infinity';
grant update(video_progress,playback_saved_at) on public.lesson_progress to authenticated;
create function public.save_playback_position(target_lesson uuid, playback_seconds integer, observed_at timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare lesson_duration integer; course_id uuid;
begin
  if playback_seconds is null or playback_seconds < 0 or playback_seconds > 2147483646
    or observed_at is null or not isfinite(observed_at) or observed_at > clock_timestamp()+interval '1 minute' then
    raise exception 'Invalid playback position' using errcode='22023';
  end if;
  select l.duration,m.course_id into lesson_duration,course_id from public.lessons l
    join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
    where l.id=target_lesson and l.is_published and c.is_published;
  if not found or not private.has_course_access(course_id) then raise exception 'Lesson access denied' using errcode='42501'; end if;
  if lesson_duration>0 then playback_seconds:=least(playback_seconds,lesson_duration); end if;
  insert into public.lesson_progress(user_id,lesson_id,video_progress,playback_saved_at)
    values(auth.uid(),target_lesson,playback_seconds,observed_at)
    on conflict(user_id,lesson_id) do update set video_progress=excluded.video_progress,playback_saved_at=excluded.playback_saved_at
    where public.lesson_progress.playback_saved_at < excluded.playback_saved_at;
end;
$$;
revoke all on function public.save_playback_position(uuid,integer,timestamptz) from public,anon;
grant execute on function public.save_playback_position(uuid,integer,timestamptz) to authenticated;
commit;
