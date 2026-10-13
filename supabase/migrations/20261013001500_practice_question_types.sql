begin;
-- One fully correct task = one point. Matching/multiple tasks require an exact answer.
-- Legacy single-answer exams and their results remain valid.
create function private.valid_practice_answer(q jsonb, chosen jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare kind text:=coalesce(q->>'kind','single'); n integer; v jsonb;
begin
 if jsonb_typeof(q->'options') is distinct from 'array' then return false; end if;
 n:=jsonb_array_length(q->'options');
 if kind='single' then
  return coalesce(jsonb_typeof(chosen)='number' and chosen::text ~ '^[0-5]$' and (chosen::text)::numeric < n,false);
 end if;
 if kind not in ('multiple','matching') or jsonb_typeof(chosen) is distinct from 'array' then return false; end if;
 if jsonb_array_length(chosen) not between 1 and 6 then return false; end if;
 for v in select value from jsonb_array_elements(chosen) loop
  if jsonb_typeof(v) is distinct from 'number' or v::text !~ '^[0-5]$' then return false; end if;
  if (v::text)::int>=n then return false; end if;
 end loop;
 if kind='multiple' then
  return jsonb_array_length(chosen)=(select count(distinct value) from jsonb_array_elements(chosen));
 end if;
 if jsonb_typeof(q->'rows') is distinct from 'array' then return false; end if;
 if jsonb_array_length(q->'rows') not between 2 and 6 then return false; end if;
 if exists(select 1 from jsonb_array_elements(q->'rows') row_item where jsonb_typeof(row_item)<>'string' or length(row_item#>>'{}') not between 1 and 3000) then return false; end if;
 return jsonb_array_length(chosen)=jsonb_array_length(q->'rows');
end $$;
revoke all on function private.valid_practice_answer(jsonb,jsonb) from public,anon,authenticated;

create or replace function public.admin_save_practice(target uuid, latex_source text, quiz_questions jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare q jsonb;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if latex_source is null or length(latex_source)>250000 or jsonb_typeof(quiz_questions) is distinct from 'array'
 then raise exception 'Invalid source'; end if;
 if jsonb_array_length(quiz_questions) not between 1 and 100 then raise exception 'Invalid count'; end if;
 for q in select value from jsonb_array_elements(quiz_questions) loop
  if jsonb_typeof(q->'prompt') is distinct from 'string' or length(q->>'prompt') not between 1 and 20000
   or jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not in (4,6)
   or exists(select 1 from jsonb_array_elements(q->'options') v where jsonb_typeof(v)<>'string' or length(v#>>'{}') not between 1 and 3000)
   or not private.valid_practice_answer(q,q->'answer')
   or jsonb_typeof(q->'solution') is distinct from 'string' or length(q->>'solution') not between 1 and 20000
  then raise exception 'Invalid question'; end if;
 end loop;
 perform 1 from public.practice_exams where id=target for update;
 if not found then raise exception 'Exam not found'; end if;
 insert into public.practice_content(exam_id,source,questions) values(target,latex_source,quiz_questions)
 on conflict(exam_id) do update set source=excluded.source,questions=excluded.questions,
 version=public.practice_content.version+case when public.practice_content.questions<>excluded.questions then 1 else 0 end;
end $$;

create or replace function public.get_practice(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare h public.practice_content; r public.practice_results; qs jsonb;
begin
 if not private.can_access_practice(target) then raise exception 'Access denied' using errcode='42501'; end if;
 select * into h from public.practice_content where exam_id=target;
 if not found then return null; end if;
 select * into r from public.practice_results where exam_id=target and user_id=auth.uid() and version=h.version;
 select jsonb_agg(jsonb_build_object('id',i-1,'prompt',q->'prompt','options',q->'options','kind',coalesce(q->>'kind','single'),'rows',coalesce(q->'rows','[]'::jsonb),
 'answer',case when r.user_id is not null then q->'answer' else null end,
 'solution',case when r.user_id is not null then q->'solution' else null end) order by i)
 into qs from jsonb_array_elements(h.questions) with ordinality t(q,i);
 return jsonb_build_object('version',h.version,'questions',qs,'score',r.score,'answers',r.answers,'submittedAt',r.submitted_at);
end $$;

create or replace function public.submit_practice(target uuid, expected_version integer, chosen jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare h public.practice_content; q jsonb; i integer:=0; score integer:=0;
begin
 if not private.can_access_practice(target) then raise exception 'Access denied' using errcode='42501'; end if;
 select * into h from public.practice_content where exam_id=target for update;
 if not found or h.version<>expected_version then raise exception 'Version changed'; end if;
 if jsonb_typeof(chosen) is distinct from 'array' or jsonb_array_length(chosen)<>jsonb_array_length(h.questions) then raise exception 'Answer every question'; end if;
 for q in select value from jsonb_array_elements(h.questions) loop
  if not private.valid_practice_answer(q,chosen->i) then raise exception 'Invalid answer'; end if;
  if coalesce(q->>'kind','single')='multiple' then
   if (chosen->i) @> (q->'answer') and (q->'answer') @> (chosen->i) then score:=score+1; end if;
  elsif (chosen->i)=(q->'answer') then score:=score+1; end if;
  i:=i+1;
 end loop;
 insert into public.practice_results(exam_id,user_id,version,answers,score) values(target,auth.uid(),h.version,chosen,score)
 on conflict(exam_id,user_id) do update set version=excluded.version,answers=excluded.answers,score=excluded.score,submitted_at=now();
 return public.get_practice(target);
end $$;
revoke all on function public.admin_save_practice(uuid,text,jsonb),public.get_practice(uuid),public.submit_practice(uuid,integer,jsonb) from public,anon;
grant execute on function public.admin_save_practice(uuid,text,jsonb),public.get_practice(uuid),public.submit_practice(uuid,integer,jsonb) to authenticated;
commit;
