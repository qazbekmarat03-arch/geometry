begin;
alter table public.courses add column lesson_unlock_mode text not null default 'all'
  check(lesson_unlock_mode in ('all','sequential'));

create function private.can_access_lesson(target_lesson uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lessons l join public.modules m on m.id=l.module_id
    join public.courses c on c.id=m.course_id
    where l.id=target_lesson and l.is_published and c.is_published
    and private.has_course_access(c.id)
    and (c.lesson_unlock_mode='all' or not exists (
      select 1 from public.lessons previous join public.modules pm on pm.id=previous.module_id
      where pm.course_id=c.id and previous.is_published
      and (pm.position,previous.position)<(m.position,l.position)
      and not exists(select 1 from public.lesson_progress p
        where p.user_id=auth.uid() and p.lesson_id=previous.id and p.completed)
    ))
  );
$$;
revoke all on function private.can_access_lesson(uuid) from public,anon,authenticated;
grant execute on function private.can_access_lesson(uuid) to authenticated;
create function public.can_access_lesson(target_lesson uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.can_access_lesson(target_lesson);
$$;
revoke all on function public.can_access_lesson(uuid) from public,anon;
grant execute on function public.can_access_lesson(uuid) to authenticated;

drop policy lessons_student_read on public.lessons;
create policy lessons_student_read on public.lessons for select to authenticated
  using (private.can_access_lesson(id));
-- Safe outline: locked lessons expose names/order/duration only, never media,
-- homework references or lesson descriptions. No caller-supplied user ID.
create function public.get_course_curriculum(target_course uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not private.has_course_access(target_course) or not exists(select 1 from public.courses where id=target_course and is_published) then
    raise exception 'Course access denied' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'position',m.position,'lessons',(
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',l.id,'title',l.title,'position',l.position,'duration',l.duration,'is_published',true,
      'is_locked',not private.can_access_lesson(l.id),
      'description',case when private.can_access_lesson(l.id) then l.description else null end,
      'progress',(select jsonb_build_object('lesson_id',p.lesson_id,'completed',p.completed,'video_progress',p.video_progress,'updated_at',p.updated_at)
        from public.lesson_progress p where p.lesson_id=l.id and p.user_id=auth.uid())
    ) order by l.position),'[]'::jsonb) from public.lessons l where l.module_id=m.id and l.is_published
  )) order by m.position),'[]'::jsonb) into result from public.modules m where m.course_id=target_course;
  return result;
end;
$$;
revoke all on function public.get_course_curriculum(uuid) from public,anon;
grant execute on function public.get_course_curriculum(uuid) to authenticated;
commit;
