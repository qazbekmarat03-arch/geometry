begin;
create table public.practice_exams (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 160),
 description text not null default '' check(length(description)<=3000),
 is_free boolean not null default false, is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.practice_content (
 exam_id uuid primary key references public.practice_exams on delete cascade,
 source text not null check(length(source)<=250000), questions jsonb not null,
 version integer not null default 1,
 check(jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 100)
);
create table public.practice_access (
 exam_id uuid references public.practice_exams on delete cascade,
 user_id uuid references public.profiles on delete cascade,
 created_at timestamptz not null default now(), primary key(exam_id,user_id)
);
create index practice_access_user_idx on public.practice_access(user_id);
create table public.practice_results (
 exam_id uuid references public.practice_exams on delete cascade,
 user_id uuid references public.profiles on delete cascade,
 version integer not null, answers jsonb not null, score integer not null,
 submitted_at timestamptz not null default now(), primary key(exam_id,user_id)
);
alter table public.practice_exams enable row level security;
alter table public.practice_content enable row level security;
alter table public.practice_access enable row level security;
alter table public.practice_results enable row level security;
revoke all on public.practice_exams,public.practice_content,public.practice_access,public.practice_results from anon,authenticated;
grant select on public.practice_exams to anon,authenticated;
grant insert,update,delete on public.practice_exams to authenticated;
grant select on public.practice_content,public.practice_results to authenticated;
grant select,insert,delete on public.practice_access to authenticated;
create policy exam_public_catalog on public.practice_exams for select to anon using(is_published);
create policy exam_catalog on public.practice_exams for select to authenticated using(is_published or private.is_admin());
create policy exam_admin on public.practice_exams for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy content_admin on public.practice_content for select to authenticated using(private.is_admin());
create policy grants_admin on public.practice_access for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy own_grants on public.practice_access for select to authenticated using(user_id=auth.uid() and private.is_active_user());
create policy own_results on public.practice_results for select to authenticated using(private.is_active_user() and user_id=auth.uid());

create function private.can_access_practice(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_user() and exists(select 1 from public.practice_exams e where e.id=target and
 (private.is_admin() or (e.is_published and (e.is_free or exists(select 1 from public.practice_access a where a.exam_id=e.id and a.user_id=auth.uid())))));
$$;
revoke all on function private.can_access_practice(uuid) from public,anon,authenticated;

create function public.admin_save_practice(target uuid, latex_source text, quiz_questions jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare q jsonb;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if latex_source is null or length(latex_source)>250000 or jsonb_typeof(quiz_questions) is distinct from 'array'
 then raise exception 'Invalid source'; end if;
 if jsonb_array_length(quiz_questions) not between 1 and 100 then raise exception 'Invalid count'; end if;
 for q in select value from jsonb_array_elements(quiz_questions) loop
  if jsonb_typeof(q->'prompt') is distinct from 'string' or length(q->>'prompt') not between 1 and 20000
   or jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options')<>4
   or exists(select 1 from jsonb_array_elements(q->'options') v where jsonb_typeof(v)<>'string' or length(v#>>'{}') not between 1 and 3000)
   or q->>'answer' is null or q->>'answer' !~ '^[0-3]$'
   or jsonb_typeof(q->'solution') is distinct from 'string' or length(q->>'solution') not between 1 and 20000
  then raise exception 'Invalid question'; end if;
 end loop;
 perform 1 from public.practice_exams where id=target for update;
 if not found then raise exception 'Exam not found'; end if;
 insert into public.practice_content(exam_id,source,questions) values(target,latex_source,quiz_questions)
 on conflict(exam_id) do update set source=excluded.source,questions=excluded.questions,
 version=public.practice_content.version+case when public.practice_content.questions<>excluded.questions then 1 else 0 end;
end $$;

create function public.get_practice(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare h public.practice_content; r public.practice_results; qs jsonb;
begin
 if not private.can_access_practice(target) then raise exception 'Access denied' using errcode='42501'; end if;
 select * into h from public.practice_content where exam_id=target;
 if not found then return null; end if;
 select * into r from public.practice_results where exam_id=target and user_id=auth.uid() and version=h.version;
 select jsonb_agg(jsonb_build_object('id',i-1,'prompt',q->'prompt','options',q->'options',
 'answer',case when r.user_id is not null then q->'answer' else null end,
 'solution',case when r.user_id is not null then q->'solution' else null end) order by i)
 into qs from jsonb_array_elements(h.questions) with ordinality t(q,i);
 return jsonb_build_object('version',h.version,'questions',qs,'score',r.score,'answers',r.answers,'submittedAt',r.submitted_at);
end $$;

create function public.submit_practice(target uuid, expected_version integer, chosen jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare h public.practice_content; q jsonb; i integer:=0; score integer:=0;
begin
 if not private.can_access_practice(target) then raise exception 'Access denied' using errcode='42501'; end if;
 select * into h from public.practice_content where exam_id=target for update;
 if not found or h.version<>expected_version then raise exception 'Version changed'; end if;
 if jsonb_typeof(chosen) is distinct from 'array' or jsonb_array_length(chosen)<>jsonb_array_length(h.questions) then raise exception 'Answer every question'; end if;
 for q in select value from jsonb_array_elements(h.questions) loop
  if jsonb_typeof(chosen->i) is distinct from 'number' or chosen->>i !~ '^[0-3]$' then raise exception 'Invalid answer'; end if;
  if (chosen->>i)::integer=(q->>'answer')::integer then score:=score+1; end if;
  i:=i+1;
 end loop;
 insert into public.practice_results(exam_id,user_id,version,answers,score) values(target,auth.uid(),h.version,chosen,score)
 on conflict(exam_id,user_id) do update set version=excluded.version,answers=excluded.answers,score=excluded.score,submitted_at=now();
 return public.get_practice(target);
end $$;
revoke all on function public.admin_save_practice(uuid,text,jsonb),public.get_practice(uuid),public.submit_practice(uuid,integer,jsonb) from public,anon;
grant execute on function public.admin_save_practice(uuid,text,jsonb),public.get_practice(uuid),public.submit_practice(uuid,integer,jsonb) to authenticated;
commit;
