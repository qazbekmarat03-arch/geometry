begin;
create table public.theory_topics (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id) on delete cascade,
 title text not null check(length(title) between 1 and 160),
 source text not null check(length(source) between 1 and 100000),
 position integer not null default 0 check(position >= 0),
 is_published boolean not null default false,
 updated_at timestamptz not null default now()
);
create index theory_topics_course_position on public.theory_topics(course_id,position,id);
alter table public.theory_topics enable row level security;
revoke all on public.theory_topics from anon,authenticated;
grant select,insert,update,delete on public.theory_topics to authenticated;
create policy theory_admin on public.theory_topics for all to authenticated
 using(private.is_admin()) with check(private.is_admin());
create policy theory_student_read on public.theory_topics for select to authenticated
 using(is_published and private.has_course_access(course_id) and exists(
 select 1 from public.courses c where c.id=course_id and c.is_published));
commit;
