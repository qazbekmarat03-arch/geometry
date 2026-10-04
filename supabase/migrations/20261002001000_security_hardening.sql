begin;

-- RLS must enforce the same verified identity requirements as the application.
create or replace function private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = (select auth.uid()) and p.is_active
      and u.email_confirmed_at is not null and nullif(btrim(u.email), '') is not null
      and lower(btrim(p.email)) = lower(btrim(u.email))
  );
$$;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user() and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- SELECT permits clients to mint their own arbitrarily long Storage signed URLs.
-- Only the server may sign student media, after checking the current enrollment.
drop policy course_media_student_read on storage.objects;
drop policy homework_student_read on storage.objects;
-- A restrictive policy also guards against unrelated permissive Storage policies.
create policy protected_media_authenticated_guard on storage.objects
as restrictive for all to authenticated
using (bucket_id not in ('course-media', 'homework') or (select private.is_admin()))
with check (bucket_id not in ('course-media', 'homework') or (select private.is_admin()));
create policy protected_media_anonymous_guard on storage.objects
as restrictive for all to anon
using (bucket_id not in ('course-media', 'homework'))
with check (bucket_id not in ('course-media', 'homework'));
update storage.buckets set public = false where id in ('course-media', 'homework');

commit;
