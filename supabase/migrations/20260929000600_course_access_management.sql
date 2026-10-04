begin;

create function public.admin_set_course_access(
  student_id uuid, target_course_id uuid, access_mode text, custom_date date default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.profiles; expiration timestamptz;
begin
  if not private.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  select * into target from public.profiles where id = student_id and role = 'student' for update;
  if target.id is null then raise exception 'Student not found'; end if;
  if not exists(select 1 from public.courses where id = target_course_id) then raise exception 'Course not found'; end if;
  if access_mode = 'none' then expiration := null;
  elsif access_mode in ('30', '60', '90') then
    expiration := now() + (access_mode::integer * interval '24 hours');
  elsif access_mode = 'custom' and custom_date is not null and isfinite(custom_date) then
    -- A selected date is inclusive, in the platform's Kazakhstan timezone.
    expiration := (custom_date + 1)::timestamp at time zone 'Asia/Almaty';
    if expiration <= now() then raise exception 'Expiration must be in the future'; end if;
  elsif access_mode <> 'remove' or access_mode is null then
    raise exception 'Invalid access mode';
  end if;

  -- An explicit admin decision supersedes pre-authorization and cannot be
  -- undone by claiming or revoking an old invitation later.
  delete from public.student_invitations
    where email = lower(btrim(target.email)) and course_id = target_course_id;
  if access_mode = 'remove' then
    delete from public.course_access where user_id = student_id and course_id = target_course_id;
  else
    insert into public.course_access(user_id, course_id, is_active, expires_at)
      values(student_id, target_course_id, true, expiration)
      on conflict(user_id, course_id) do update set is_active = true, expires_at = excluded.expires_at;
  end if;
end;
$$;
revoke all on function public.admin_set_course_access(uuid,uuid,text,date) from public, anon, authenticated;
grant execute on function public.admin_set_course_access(uuid,uuid,text,date) to authenticated;

-- Existing private.has_course_access requires expires_at > now() (or NULL).
-- Course, lesson, progress, and Storage policies all depend on that check.
-- Expired rows are retained for admin visibility; no scheduled job is needed.
commit;
