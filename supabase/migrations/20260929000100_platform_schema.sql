-- Run as the database owner through Supabase migrations or the SQL editor.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('admin', 'student')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  description text,
  thumbnail_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  position integer not null default 0 check (position >= 0),
  unique (course_id, position) deferrable initially immediate
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  video_url text,
  duration integer not null default 0 check (duration >= 0),
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default false,
  homework_pdf_url text,
  created_at timestamptz not null default now(),
  unique (module_id, position) deferrable initially immediate
);
comment on column public.lessons.duration is 'Video duration in seconds.';
comment on column public.lessons.video_url is 'Private object path or protected video provider URL. Do not store permanent public URLs for paid content.';
comment on column public.lessons.homework_pdf_url is 'Private storage object path; sign after checking course access.';

create table public.course_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
comment on column public.course_access.expires_at is 'NULL means no expiration. Access expires when expires_at <= now().';

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  video_progress integer not null default 0 check (video_progress >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
comment on column public.lesson_progress.video_progress is 'Playback position in whole seconds, not a percentage.';

-- Parent+position and user+content unique constraints already index their keys.
create index course_access_course_id_idx on public.course_access(course_id);
create index lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.course_access enable row level security;
alter table public.lesson_progress enable row level security;

-- No inherited/default API grants, including TRUNCATE or REFERENCES.
revoke all on public.profiles, public.courses, public.modules, public.lessons,
  public.course_access, public.lesson_progress from public, anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.courses, public.modules,
  public.lessons, public.course_access to authenticated;
grant select, insert on public.lesson_progress to authenticated;
grant update (completed, video_progress) on public.lesson_progress to authenticated;
grant all on public.profiles, public.courses, public.modules, public.lessons,
  public.course_access, public.lesson_progress to service_role;

-- Keep security-definer helpers outside the API's exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create function private.is_active_user()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles
    where id = (select auth.uid()) and is_active);
$$;

create function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and is_active);
$$;

create function private.has_course_access(target_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user() and exists (
    select 1 from public.course_access
    where user_id = (select auth.uid()) and course_id = target_course_id
      and is_active and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function private.is_active_user(), private.is_admin(),
  private.has_course_access(uuid) from public, anon, authenticated;
grant execute on function private.is_active_user(), private.is_admin(),
  private.has_course_access(uuid) to authenticated;

-- Profiles are created only from Auth. Never trust metadata for roles/access.
create function private.handle_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.profiles (id, email, full_name, avatar_url)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'avatar_url');
  else
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function private.handle_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_auth_user();
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function private.handle_auth_user();

-- Support users that existed before this migration. Everyone starts as student.
insert into public.profiles (id, email, full_name, avatar_url)
select id, email, raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'avatar_url'
from auth.users on conflict (id) do nothing;

create function private.touch_lesson_progress()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.touch_lesson_progress() from public, anon, authenticated;
create trigger lesson_progress_timestamp before insert or update on public.lesson_progress
  for each row execute function private.touch_lesson_progress();

create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
-- Students cannot change ANY profile field, especially role and is_active.
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy courses_admin_manage on public.courses for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy courses_student_read on public.courses for select to authenticated
  using (is_published and private.has_course_access(id));

create policy modules_admin_manage on public.modules for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy modules_student_read on public.modules for select to authenticated
  using (exists (select 1 from public.courses c where c.id = modules.course_id));

create policy lessons_admin_manage on public.lessons for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy lessons_student_read on public.lessons for select to authenticated
  using (is_published and exists (
    select 1 from public.modules m where m.id = lessons.module_id
  ));

-- There is deliberately NO student INSERT/UPDATE/DELETE access policy.
create policy course_access_admin_manage on public.course_access for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy course_access_student_read on public.course_access for select to authenticated
  using (user_id = (select auth.uid()) and (select private.is_active_user()));

create policy progress_admin_read on public.lesson_progress for select to authenticated
  using ((select private.is_admin()));
create policy progress_student_read on public.lesson_progress for select to authenticated
  using (user_id = (select auth.uid()) and (select private.is_active_user())
    and exists (select 1 from public.lessons l where l.id = lesson_progress.lesson_id));
create policy progress_student_insert on public.lesson_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_active_user())
    and exists (select 1 from public.lessons l where l.id = lesson_progress.lesson_id));
create policy progress_student_update on public.lesson_progress for update to authenticated
  using (user_id = (select auth.uid()) and (select private.is_active_user())
    and exists (select 1 from public.lessons l where l.id = lesson_progress.lesson_id))
  with check (user_id = (select auth.uid()) and (select private.is_active_user())
    and exists (select 1 from public.lessons l where l.id = lesson_progress.lesson_id));

commit;
