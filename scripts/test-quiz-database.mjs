// Real PostgreSQL execution via PGlite. Only Supabase's Auth scaffolding is mocked.
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
let checks = 0;
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const admin = id(1),
  student = id(2),
  other = id(3),
  legacy = id(4);
const course = id(10);
const courseModule = id(20);
const lesson = id(30), draftLesson = id(31);
async function eq(sql, expected, label) {
  const result = await db.query(sql);
  assert.equal(Object.values(result.rows[0])[0], expected, label);
  checks++;
}
async function denied(sql, label) {
  await assert.rejects(
    () => db.exec(sql),
    (error) => error.code === "42501",
    label,
  );
  checks++;
}
async function asUser(user) {
  await db.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`,
  );
}
async function asOwner() {
  await db.exec("reset role");
}
try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select,insert,update,delete on storage.objects to authenticated;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
    create table auth.identities (user_id uuid references auth.users(id), provider text, identity_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users(id,email) values ('${legacy}','legacy@example.test');
  `);
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(migrations))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (file === "20261004001100_single_google_admin.sql") {
      await db.exec(
        `update public.profiles set role='admin' where id='${legacy}'`,
      );
    }
    await db.exec(await readFile(new URL(file, migrations), "utf8"));
  }

  await db.exec(`insert into auth.users(id,email,email_confirmed_at) values
    ('${admin}','qazbek03@gmail.com',now()),('${student}','student@example.test',now()),('${other}','other@example.test',now());
    insert into auth.identities values ('${admin}','google','{"email":"qazbek03@gmail.com","email_verified":true}');
    update profiles set role='admin' where id='${admin}';
    insert into courses(id,title,is_published) values ('${course}','Quiz course',true);
    insert into modules(id,course_id,title,position) values ('${courseModule}','${course}','Module',0);
    insert into lessons(id,module_id,title,position,is_published) values ('${lesson}','${courseModule}','Quiz lesson',0,true),('${draftLesson}','${courseModule}','Next lesson',1,true);
    insert into course_access(user_id,course_id,is_active) values ('${student}','${course}',true),('${other}','${course}',true);`);
  const questions=Array.from({length:5},(_,i)=>({prompt:`Question ${i}`,options:['A','B','C','D'],answer:0,solution:'Private solution'}));
  await asUser(admin);
  await db.query('select admin_save_homework($1,$2,$3,$4)',[lesson,'both','source with key',JSON.stringify(questions)]);
  await asUser(student);
  await eq('select count(*)::int from lesson_homework',0,'student cannot read answer keys');
  await denied(`select admin_save_homework('${lesson}','pdf','','[]')`,'student cannot disable gate');
  await eq(`select can_access_lesson('${lesson}')`,true,'quiz lesson allowed');
  await eq(`select can_access_lesson('${draftLesson}')`,false,'next blocked even all mode');
  await denied(`select save_lesson_progress('${course}','${lesson}',null,true)`,'completion RPC cannot bypass test');
  await denied(`insert into lesson_progress(user_id,lesson_id,completed) values('${student}','${lesson}',true)`,'direct completion cannot bypass test');
  let state=(await db.query('select get_lesson_quiz($1) as q',[lesson])).rows[0].q;
  assert.ok(state.questions.every(q=>q.answer===null&&q.solution===null));checks++;
  const submit=async(version,round,answers)=>(await db.query('select submit_lesson_quiz($1,$2,$3,$4) as q',[lesson,version,round,JSON.stringify(answers)])).rows[0].q;
  await assert.rejects(()=>submit(1,0,{'0':0}));checks++;
  state=await submit(1,0,{'0':0,'1':0,'2':0,'3':0,'4':1});
  assert.equal(state.correctCount,4);assert.equal(state.passed,false);checks+=2;
  assert.ok(state.questions.every(q=>q.solution===null));checks++;
  await eq(`select can_access_lesson('${draftLesson}')`,false,'exactly 80 percent does not pass');
  await assert.rejects(()=>submit(1,0,{'4':0}));checks++;
  await assert.rejects(()=>submit(1,1,{'0':0,'4':0}));checks++;
  state=await submit(1,1,{'4':2});
  assert.equal(state.questions[4].solution,'Private solution');assert.equal(state.questions[0].solution,null);checks+=2;
  state=await submit(1,2,{'4':0});assert.equal(state.passed,true);checks++;
  await eq(`select can_access_lesson('${draftLesson}')`,true,'passed test unlocks next');
  await eq(`select completed from lesson_progress where user_id='${student}' and lesson_id='${lesson}'`,true,'passing completes lesson');
  await asUser(other);
  await eq(`select can_access_lesson('${draftLesson}')`,false,'another student remains blocked');
  await denied(`update quiz_results set passed=true where lesson_id='${lesson}'`,'cannot forge score');
  await asUser(admin);
  questions[0].prompt='Revised question';
  await db.query('select admin_save_homework($1,$2,$3,$4)',[lesson,'quiz','revised source',JSON.stringify(questions)]);
  await asUser(student);
  await eq(`select can_access_lesson('${draftLesson}')`,false,'editing test invalidates prior pass even completed progress');
  await assert.rejects(()=>submit(1,3,{'4':0}));checks++;
  await asUser(admin);
  await db.query('select admin_save_homework($1,$2,$3,$4)',[lesson,'pdf','revised source',JSON.stringify(questions)]);
  await asUser(student);
  await eq(`select can_access_lesson('${draftLesson}')`,true,'PDF only needs no score');
  await asOwner();await db.exec(`update course_access set expires_at=now()-interval '1 second' where user_id='${student}'`);
  await asUser(student);
  await denied(`select get_lesson_quiz('${lesson}')`,'expired access blocks test');
  await asOwner();await db.exec(`update profiles set is_active=false where id='${other}'`);await asUser(other);
  await denied(`select get_lesson_quiz('${lesson}')`,'inactive user blocked');
  await asOwner();await db.exec('set role anon');
  await denied(`select get_lesson_quiz('${lesson}')`,'anonymous blocked');
  // Standalone practice exams never inherit course access or expose answer keys.
  const paid=id(70),free=id(71);
  await asUser(admin);
  await db.exec(`insert into practice_exams(id,title,is_published,is_free) values ('${paid}','Paid',true,false),('${free}','Free',true,true)`);
  for(const exam of [paid,free])await db.query('select admin_save_practice($1,$2,$3)',[exam,'private source',JSON.stringify(questions)]);
  await asOwner();await db.exec('set role anon');
  await eq('select count(*)::int from practice_exams',2,'public metadata visible');
  await denied(`select * from practice_content`,'anonymous cannot read solutions');
  await denied(`select get_practice('${free}')`,'login required for free test');
  await asUser(student);
  await eq('select count(*)::int from practice_content',0,'answer source admin-only');
  await denied(`select get_practice('${paid}')`,'paid course access does not grant exam');
  await denied(`insert into practice_access(exam_id,user_id) values ('${paid}','${student}')`,'student cannot grant access');
  await denied(`select admin_save_practice('${paid}','x','[]')`,'student cannot edit exams');
  const getPractice=async exam=>(await db.query('select get_practice($1) as value',[exam])).rows[0].value;
  let practice=await getPractice(free);assert.ok(practice.questions.every(q=>q.answer===null&&q.solution===null));checks++;
  await assert.rejects(()=>db.query('select submit_practice($1,1,$2)',[free,'[0]']));checks++;
  practice=(await db.query('select submit_practice($1,1,$2) as value',[free,'[0,0,0,0,1]'])).rows[0].value;
  assert.equal(practice.score,4);assert.equal(practice.questions[4].answer,0);checks+=2;
  await denied(`update practice_results set score=999`,'cannot forge result');
  await asUser(admin);await db.exec(`insert into practice_access(exam_id,user_id) values ('${paid}','${student}')`);
  await asUser(student);assert.ok(await getPractice(paid));checks++;
  await asUser(other);await denied(`select get_practice('${free}')`,'inactive student denied free access');
  await asOwner();await db.exec(`update profiles set is_active=true where id='${other}'`);await asUser(other);
  await denied(`select get_practice('${paid}')`,'another student denied');
  assert.equal((await getPractice(free)).score,null);checks++;
  await asUser(admin);await db.exec(`delete from practice_access where exam_id='${paid}'`);
  await asUser(student);await denied(`select get_practice('${paid}')`,'revocation immediate');
  await asUser(admin);questions[0].prompt='New version';await db.query('select admin_save_practice($1,$2,$3)',[free,'new',JSON.stringify(questions)]);
  await asUser(student);await assert.rejects(()=>db.query('select submit_practice($1,1,$2)',[free,'[0,0,0,0,0]']));checks++;
  assert.equal((await getPractice(free)).score,null);checks++;
  await asUser(admin);await db.exec(`update practice_exams set is_published=false where id='${free}'`);
  await asUser(student);await denied(`select get_practice('${free}')`,'unpublished exam inaccessible');
  console.log(`Quiz and practice security: ${checks} checks passed.`);
} finally { await db.close(); }
