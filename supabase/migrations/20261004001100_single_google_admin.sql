begin;

-- The owner is a verified Auth identity, never a client-supplied email or role.
create function private.is_owner_account(target_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join auth.identities i on i.user_id = u.id
    where u.id = target_user
      and lower(btrim(u.email)) = 'qazbek03@gmail.com'
      and u.email_confirmed_at is not null
      and i.provider = 'google'
      and lower(btrim(i.identity_data ->> 'email')) = 'qazbek03@gmail.com'
      and i.identity_data ->> 'email_verified' = 'true'
  );
$$;
revoke all on function private.is_owner_account(uuid) from public, anon, authenticated;

-- Remove any previous administrator assignments outside the owner's identity.
update public.profiles set role = 'student'
where role = 'admin' and not private.is_owner_account(id);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and private.is_owner_account((select auth.uid()))
    and exists (select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin');
$$;

-- Even a direct profile update cannot appoint a second administrator.
create function private.guard_owner_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'admin' and (
    lower(btrim(new.email)) is distinct from 'qazbek03@gmail.com'
    or not private.is_owner_account(new.id)
  ) then
    raise exception 'Only the verified Google owner can be administrator' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_owner_role() from public, anon, authenticated;
create trigger profiles_owner_role before insert or update of role on public.profiles
  for each row execute function private.guard_owner_role();

-- Called after OAuth exchange (Auth identities exist by then), including for
-- accounts created before this migration. Inactive accounts stay inactive.
create function public.claim_owner_admin()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner_account(auth.uid()) then
    raise exception 'Verified Google owner required' using errcode = '42501';
  end if;
  update public.profiles set role = 'admin'
  where id = auth.uid() and is_active and role <> 'admin'
    and lower(btrim(email)) = 'qazbek03@gmail.com';
end;
$$;
revoke all on function public.claim_owner_admin() from public, anon, authenticated;
grant execute on function public.claim_owner_admin() to authenticated;

update public.profiles set role = 'admin'
where is_active and lower(btrim(email)) = 'qazbek03@gmail.com'
  and private.is_owner_account(id);

commit;
