begin;

-- An invitation is a single-use course grant, not an Auth user or password.
create table public.student_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  claimed_by uuid references public.profiles(id) on delete cascade,
  unique(email, course_id)
);
create index student_invitations_course_idx on public.student_invitations(course_id);
create index student_invitations_claimed_idx on public.student_invitations(claimed_by);
create index profiles_students_created_idx on public.profiles(created_at desc, id) where role = 'student';
alter table public.student_invitations enable row level security;
revoke all on public.student_invitations from public, anon, authenticated;
grant select, insert on public.student_invitations to authenticated;
grant all on public.student_invitations to service_role;
create policy invitations_admin_read on public.student_invitations for select to authenticated using ((select private.is_admin()));
create policy invitations_admin_insert on public.student_invitations for insert to authenticated with check ((select private.is_admin()) and claimed_by is null);

-- Called with the user's cookie-backed client. Identity and verified email come
-- from Auth, never a browser-supplied email or metadata. Locking the profile
-- serializes claiming against administrator revocation.
create function public.claim_student_invitations()
returns void language plpgsql security definer set search_path = '' as $$
declare target public.profiles; verified_email text; invitation public.student_invitations;
begin
  select * into target from public.profiles where id = auth.uid() for update;
  if target.id is null or target.role <> 'student' or not target.is_active then return; end if;
  select lower(btrim(email)) into verified_email from auth.users
    where id = target.id and email_confirmed_at is not null;
  if verified_email is null or verified_email is distinct from lower(btrim(target.email)) then return; end if;
  for invitation in select * from public.student_invitations
    where email = verified_email and claimed_by is null order by id for update loop
    insert into public.course_access(user_id, course_id) values(target.id, invitation.course_id)
      on conflict (user_id, course_id) do nothing;
    update public.student_invitations set claimed_by = target.id where id = invitation.id;
  end loop;
end;
$$;

create function public.admin_manage_student(target_id uuid, operation text, access_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.profiles; removed_course uuid;
begin
  if not private.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  select * into target from public.profiles where id = target_id and role = 'student' for update;
  if target.id is null then raise exception 'Student not found'; end if;
  if operation = 'activate' then
    update public.profiles set is_active = true where id = target.id;
  elsif operation = 'deactivate' then
    update public.profiles set is_active = false where id = target.id;
    delete from public.student_invitations where email = lower(btrim(target.email)) and claimed_by is null;
  elsif operation = 'remove_access' then
    delete from public.course_access where id = access_id and user_id = target.id returning course_id into removed_course;
    if removed_course is null then raise exception 'Access not found'; end if;
    delete from public.student_invitations where email = lower(btrim(target.email)) and course_id = removed_course;
  else raise exception 'Unknown operation';
  end if;
end;
$$;

-- Lock the student before the invitation, matching the claim lock order.
-- If a pending invitation was claimed meanwhile, also remove its course grant.
create function public.admin_revoke_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare invitation public.student_invitations;
begin
  if not private.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  select * into invitation from public.student_invitations where id = invitation_id;
  if invitation.id is null then raise exception 'Invitation not found'; end if;
  perform id from public.profiles where lower(btrim(email)) = invitation.email order by id for update;
  select * into invitation from public.student_invitations where id = invitation_id for update;
  if invitation.claimed_by is not null then
    delete from public.course_access where user_id = invitation.claimed_by and course_id = invitation.course_id;
  end if;
  delete from public.student_invitations where id = invitation_id;
end;
$$;
revoke all on function public.claim_student_invitations(), public.admin_manage_student(uuid,text,uuid), public.admin_revoke_invitation(uuid) from public, anon, authenticated;
grant execute on function public.claim_student_invitations(), public.admin_manage_student(uuid,text,uuid), public.admin_revoke_invitation(uuid) to authenticated;
commit;
