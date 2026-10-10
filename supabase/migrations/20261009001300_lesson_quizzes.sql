begin;
-- Answer keys and source are never readable by students, even through PostgREST.
create table public.lesson_homework (
 lesson_id uuid primary key references public.lessons(id) on delete cascade,
 mode text not null check(mode in ('pdf','quiz','both')),
 source text not null default '' check(length(source)<=250000),
 questions jsonb not null default '[]',
 version integer not null default 1,
 check(jsonb_typeof(questions)='array' and jsonb_array_length(questions)<=100)
);
create table public.quiz_results (
 user_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id uuid not null references public.lesson_homework(lesson_id) on delete cascade,
 version integer not null,
 round integer not null default 0,
 correct integer[] not null default '{}',
 failures jsonb not null default '{}',
 passed boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(user_id,lesson_id)
);
alter table public.lesson_homework enable row level security;
alter table public.quiz_results enable row level security;
revoke all on public.lesson_homework,public.quiz_results from anon,authenticated;
grant select on public.lesson_homework,public.quiz_results to authenticated;
create policy homework_admin_read on public.lesson_homework for select to authenticated using ((select private.is_admin()));
create policy quiz_admin_read on public.quiz_results for select to authenticated using ((select private.is_admin()));

create function private.quiz_passed(target_lesson uuid, target_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.lesson_homework h where h.lesson_id=target_lesson and h.mode in ('quiz','both')
   and not exists(select 1 from public.quiz_results r where r.lesson_id=h.lesson_id and r.user_id=target_user and r.version=h.version and r.passed));
$$;
revoke all on function private.quiz_passed(uuid,uuid) from public,anon,authenticated;

-- Quiz prerequisites apply even when a course otherwise permits free navigation.
create or replace function private.can_access_lesson(target_lesson uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id
 join public.courses c on c.id=m.course_id where l.id=target_lesson and l.is_published and c.is_published
 and private.has_course_access(c.id) and not exists(
   select 1 from public.lessons prev join public.modules pm on pm.id=prev.module_id
   where pm.course_id=c.id and prev.is_published and (pm.position,prev.position)<(m.position,l.position)
   and (not private.quiz_passed(prev.id,auth.uid()) or (c.lesson_unlock_mode='sequential' and not exists(
     select 1 from public.lesson_progress p where p.user_id=auth.uid() and p.lesson_id=prev.id and p.completed)))
 ));
$$;

create function private.guard_quiz_completion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.completed and not private.quiz_passed(new.lesson_id,new.user_id) then
   raise exception 'Тесттен 80%%-дан көп жинаңыз' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function private.guard_quiz_completion() from public,anon,authenticated;
create trigger quiz_completion_guard before insert or update on public.lesson_progress
 for each row execute function private.guard_quiz_completion();

create function public.admin_save_homework(target_lesson uuid, homework_mode text, latex_source text, quiz_questions jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare q jsonb; n integer; changed boolean;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if homework_mode not in ('pdf','quiz','both') or latex_source is null or length(latex_source)>250000
 or quiz_questions is null or jsonb_typeof(quiz_questions)<>'array' then raise exception 'Invalid homework' using errcode='22023'; end if;
 n:=jsonb_array_length(quiz_questions);
 if n>100 or (homework_mode<>'pdf' and n=0) then raise exception 'Invalid question count' using errcode='22023'; end if;
 for q in select value from jsonb_array_elements(quiz_questions) loop
  if jsonb_typeof(q->'prompt') is distinct from 'string' or length(q->>'prompt') not between 1 and 20000
   or jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options')<>4
   or exists(select 1 from jsonb_array_elements(q->'options') v where jsonb_typeof(v)<>'string' or length(v#>>'{}') not between 1 and 3000)
   or q->>'answer' is null or q->>'answer' !~ '^[0-3]$'
   or jsonb_typeof(q->'solution') is distinct from 'string' or length(q->>'solution') not between 1 and 20000
  then raise exception 'Invalid question' using errcode='22023'; end if;
 end loop;
 -- Lock the lesson to serialize concurrent administrative saves.
 perform 1 from public.lessons where id=target_lesson for update;
 if not found then raise exception 'Lesson not found' using errcode='22023'; end if;
 select not exists(select 1 from public.lesson_homework where lesson_id=target_lesson and questions=quiz_questions and mode=homework_mode) into changed;
 insert into public.lesson_homework(lesson_id,mode,source,questions) values(target_lesson,homework_mode,latex_source,quiz_questions)
 on conflict(lesson_id) do update set mode=excluded.mode,source=excluded.source,questions=excluded.questions,
 version=public.lesson_homework.version + case when public.lesson_homework.questions<>excluded.questions or public.lesson_homework.mode<>excluded.mode then 1 else 0 end;
 if changed and homework_mode in ('quiz','both') then update public.lesson_progress set completed=false where lesson_id=target_lesson and completed; end if;
end $$;

create function public.get_lesson_quiz(target_lesson uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare h public.lesson_homework; r public.quiz_results; qs jsonb;
begin
 if not private.can_access_lesson(target_lesson) then raise exception 'Lesson access denied' using errcode='42501'; end if;
 select * into h from public.lesson_homework where lesson_id=target_lesson;
 if not found or h.mode='pdf' then return jsonb_build_object('mode','pdf','questions','[]'::jsonb,'passed',true); end if;
 select * into r from public.quiz_results where user_id=auth.uid() and lesson_id=target_lesson and version=h.version;
 select jsonb_agg(jsonb_build_object('id',i-1,'prompt',q->'prompt','options',q->'options',
   'correct',coalesce((i-1)::integer=any(r.correct),false),
   'solution',case when coalesce((r.failures->>(i-1)::text)::integer,0)>=2 then q->>'solution' else null end,
   'answer',case when coalesce((r.failures->>(i-1)::text)::integer,0)>=2 then (q->>'answer')::integer else null end
 ) order by i) into qs from jsonb_array_elements(h.questions) with ordinality as items(q,i);
 return jsonb_build_object('mode',h.mode,'version',h.version,'round',coalesce(r.round,0),'passed',coalesce(r.passed,false),
 'total',jsonb_array_length(h.questions),'correctCount',coalesce(cardinality(r.correct),0),'questions',qs);
end $$;

create function public.submit_lesson_quiz(target_lesson uuid, quiz_version integer, expected_round integer, answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare h public.lesson_homework; r public.quiz_results; q jsonb; i integer; choice text; remaining integer;
begin
 if not private.can_access_lesson(target_lesson) then raise exception 'Lesson access denied' using errcode='42501'; end if;
 select * into h from public.lesson_homework where lesson_id=target_lesson for share;
 if not found or h.mode='pdf' or quiz_version is distinct from h.version then raise exception 'Quiz changed; refresh' using errcode='22023'; end if;
 insert into public.quiz_results(user_id,lesson_id,version) values(auth.uid(),target_lesson,h.version) on conflict do nothing;
 select * into r from public.quiz_results where user_id=auth.uid() and lesson_id=target_lesson for update;
 if r.version<>h.version then r.version:=h.version; r.round:=0; r.correct:='{}'; r.failures:='{}'; r.passed:=false; end if;
 if expected_round is distinct from r.round then raise exception 'Attempt changed; refresh' using errcode='22023'; end if;
 if answers is null or jsonb_typeof(answers)<>'object' then raise exception 'Invalid answers' using errcode='22023'; end if;
 remaining:=jsonb_array_length(h.questions)-cardinality(r.correct);
 if remaining=0 then raise exception 'All questions completed' using errcode='22023'; end if;
 if (select count(*) from jsonb_object_keys(answers))<>remaining then raise exception 'Answer all pending questions' using errcode='22023'; end if;
 for i in 0..jsonb_array_length(h.questions)-1 loop
  if i=any(r.correct) then continue; end if;
  choice:=answers->>i::text;
  if choice is null or choice !~ '^[0-3]$' then raise exception 'Invalid answer' using errcode='22023'; end if;
  q:=h.questions->i;
  if choice::integer=(q->>'answer')::integer then r.correct:=array_append(r.correct,i);
  else r.failures:=jsonb_set(r.failures,array[i::text],to_jsonb(coalesce((r.failures->>i::text)::integer,0)+1)); end if;
 end loop;
 r.passed:=cardinality(r.correct)*100>jsonb_array_length(h.questions)*80;
 update public.quiz_results set version=h.version,round=r.round+1,correct=r.correct,failures=r.failures,passed=r.passed,updated_at=now()
 where user_id=auth.uid() and lesson_id=target_lesson;
 if r.passed then
  insert into public.lesson_progress(user_id,lesson_id,completed) values(auth.uid(),target_lesson,true)
  on conflict(user_id,lesson_id) do update set completed=true;
 end if;
 return public.get_lesson_quiz(target_lesson);
end $$;
revoke all on function public.admin_save_homework(uuid,text,text,jsonb), public.get_lesson_quiz(uuid), public.submit_lesson_quiz(uuid,integer,integer,jsonb) from public,anon;
grant execute on function public.admin_save_homework(uuid,text,text,jsonb), public.get_lesson_quiz(uuid), public.submit_lesson_quiz(uuid,integer,integer,jsonb) to authenticated;
commit;
