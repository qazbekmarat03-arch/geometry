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
const course = id(10),
  locked = id(11),
  draft = id(12);
const courseModule = id(20),
  lockedModule = id(21),
  draftModule = id(22);
const lesson = id(30),
  draftLesson = id(31),
  lockedLesson = id(32),
  draftCourseLesson = id(33);
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
  await eq(
    `select role from public.profiles where id='${legacy}'`,
    "student",
    "existing users backfilled",
  );
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
    ('${admin}','qazbek03@gmail.com','{}'),
    ('${student}','student@example.test','{"role":"admin","is_active":false,"full_name":"Student"}'),
    ('${other}','other@example.test','{}');`);
  await eq(
    `select role from public.profiles where id='${student}'`,
    "student",
    "metadata cannot grant admin",
  );
  await eq(
    `select is_active from public.profiles where id='${student}'`,
    true,
    "metadata cannot change activity",
  );
  await db.exec(
    `update auth.users set email_confirmed_at=now() where id='${admin}';
     insert into auth.identities values ('${admin}', 'google', '{"email":"qazbek03@gmail.com","email_verified":true}');
     update public.profiles set role='admin' where id='${admin}'; update auth.users set email='changed@example.test' where id='${student}';`,
  );
  await eq(
    `select email from public.profiles where id='${student}'`,
    "changed@example.test",
    "auth email synchronized",
  );
  await db.exec("update auth.users set email_confirmed_at=now()");
  await asUser(admin);
  await db.exec(`
    insert into public.courses(id,title,is_published) values ('${course}','Geometry',true),('${locked}','Locked',true),('${draft}','Draft',false);
    insert into public.modules(id,course_id,title) values ('${courseModule}','${course}','Triangles'),('${lockedModule}','${locked}','Locked'),('${draftModule}','${draft}','Draft');
    insert into public.lessons(id,module_id,title,is_published,position) values
      ('${lesson}','${courseModule}','Lesson',true,0), ('${draftLesson}','${courseModule}','Draft lesson',false,1),
      ('${lockedLesson}','${lockedModule}','Locked lesson',true,0), ('${draftCourseLesson}','${draftModule}','Draft course lesson',true,0);
    update public.courses set description='Edited by admin' where id='${course}';
  `);
  await eq(
    "select count(*)::integer from public.lessons",
    4,
    "admin reads drafts and all content",
  );
  await assert.rejects(
    () =>
      db.exec(
        `update public.lessons set video_url='https://example.test/public.mp4' where id='${lesson}'`,
      ),
    (error) => error.code === "23514",
  );
  checks++;
  await db.exec(`update public.lessons set video_url='storage://course-media/allowed.mp4', duration=120 where id='${lesson}';
    update public.lessons set video_url='storage://course-media/locked.mp4' where id='${lockedLesson}';
    insert into storage.objects(bucket_id,name) values ('course-media','allowed.mp4'),('course-media','locked.mp4'),('course-media','unlinked.mp4');`);
  await asUser(student);
  for (const table of ["courses", "modules", "lessons"])
    await eq(
      `select count(*)::integer from public.${table}`,
      0,
      `unenrolled cannot read ${table}`,
    );
  await denied(
    `insert into public.course_access(user_id,course_id) values ('${student}','${course}')`,
    "cannot self-enroll",
  );
  await denied(
    `insert into public.profiles(id,role) values ('${student}','admin')`,
    "cannot insert profile",
  );
  await db.exec(
    `update public.profiles set role='admin',is_active=false where id='${student}'`,
  );
  await eq(
    `select role from public.profiles where id='${student}'`,
    "student",
    "cannot self-promote",
  );
  await eq(
    `select is_active from public.profiles where id='${student}'`,
    true,
    "cannot change own active status",
  );
  await eq(
    "select count(*)::integer from public.profiles",
    1,
    "cannot read other profiles",
  );
  await denied(
    `insert into public.courses(title) values ('Injected')`,
    "cannot create course",
  );
  await denied(
    `insert into public.modules(course_id,title,position) values ('${course}','Injected',9)`,
    "cannot create courseModule",
  );
  await denied(
    `insert into public.lessons(module_id,title,position) values ('${courseModule}','Injected',9)`,
    "cannot create lesson",
  );
  await denied(
    `insert into public.lesson_progress(user_id,lesson_id) values ('${student}','${lesson}')`,
    "no progress without access",
  );
  await asUser(admin);
  await db.exec(
    `insert into public.course_access(user_id,course_id) values ('${student}','${course}'),('${student}','${draft}'),('${other}','${course}')`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from public.courses",
    1,
    "enrolled sees only published course",
  );
  await eq(
    "select count(*)::integer from public.modules",
    1,
    "modules follow course publication and access",
  );
  await eq(
    "select count(*)::integer from public.lessons",
    1,
    "lessons follow parent and own publication",
  );
  await eq(
    "select count(*)::integer from public.course_access",
    2,
    "only own access rows visible",
  );
  await db.exec(
    `update public.course_access set course_id='${locked}' where user_id='${student}' and course_id='${course}'; delete from public.course_access where user_id='${student}';`,
  );
  await eq(
    `select count(*)::integer from public.course_access where course_id='${course}'`,
    1,
    "cannot modify or delete access",
  );
  await denied(
    `insert into public.course_access(user_id,course_id) values ('${student}','${course}') on conflict(user_id,course_id) do update set expires_at=null`,
    "cannot bypass with upsert",
  );
  await db.exec(
    `update public.courses set title='Tampered' where id='${course}'; update public.modules set title='Tampered' where id='${courseModule}'; update public.lessons set is_published=false where id='${lesson}'; delete from public.courses where id='${course}';`,
  );
  await eq(
    `select title from public.courses where id='${course}'`,
    "Geometry",
    "cannot edit/delete course",
  );
  await eq(
    `select title from public.modules where id='${courseModule}'`,
    "Triangles",
    "cannot edit courseModule",
  );
  await eq(
    `select is_published from public.lessons where id='${lesson}'`,
    true,
    "cannot edit lesson",
  );
  await db.exec(
    `insert into public.lesson_progress(user_id,lesson_id,video_progress) values ('${student}','${lesson}',42); update public.lesson_progress set completed=true,video_progress=90 where user_id='${student}'`,
  );
  await eq(
    "select video_progress from public.lesson_progress",
    90,
    "can update own playback",
  );
  await eq(
    "select completed from public.lesson_progress",
    true,
    "can complete lesson",
  );
  await db.exec(
    `select public.save_lesson_progress('${course}','${lesson}',45,false)`,
  );
  await eq(
    "select video_progress from public.lesson_progress",
    45,
    "RPC saves playback",
  );
  await eq(
    "select completed from public.lesson_progress",
    true,
    "autosave never resets completion",
  );
  await db.exec(
    `select public.save_lesson_progress('${course}','${lesson}',null,true)`,
  );
  await eq(
    "select video_progress from public.lesson_progress",
    45,
    "completion preserves playback position",
  );
  await denied(
    `select public.save_lesson_progress('${course}','${lockedLesson}',10,true)`,
    "reject lesson belonging to another course",
  );
  await denied(
    `select public.save_lesson_progress('${locked}','${lesson}',10,true)`,
    "reject forged course",
  );
  await denied(
    `select public.save_lesson_progress('${course}','${draftLesson}',10,true)`,
    "reject draft lesson in RPC",
  );
  await eq(
    "select count(*)::integer from storage.objects",
    0,
    "students cannot mint Storage URLs directly",
  );
  await denied(
    "insert into storage.objects(bucket_id,name) values ('course-media','injected.mp4')",
    "students cannot upload course media",
  );
  await denied(
    `update public.lesson_progress set user_id='${other}'`,
    "cannot transfer progress ownership",
  );
  await denied(
    `update public.lesson_progress set lesson_id='${lockedLesson}'`,
    "cannot move progress to locked lesson",
  );
  await denied(
    `insert into public.lesson_progress(user_id,lesson_id) values ('${other}','${lesson}')`,
    "cannot forge another student progress",
  );
  await denied(
    `insert into public.lesson_progress(user_id,lesson_id) values ('${student}','${draftLesson}')`,
    "cannot write draft progress",
  );
  await asUser(other);
  await eq(
    "select count(*)::integer from public.lesson_progress",
    0,
    "cannot read another student progress",
  );
  await asUser(admin);
  await db.exec(
    `update public.course_access set expires_at=now() - interval '1 second' where user_id='${student}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from public.lessons",
    0,
    "expired access hides lessons",
  );
  await denied(
    `select public.save_lesson_progress('${course}','${lesson}',10,true)`,
    "RPC rejects expired enrollment",
  );
  await eq(
    "select count(*)::integer from storage.objects",
    0,
    "expired enrollment hides private media",
  );
  await eq(
    "select count(*)::integer from public.lesson_progress",
    0,
    "expired access hides progress",
  );
  await db.exec(
    `update public.course_access set expires_at=null,is_active=true where user_id='${student}'`,
  );
  await eq(
    "select count(*)::integer from public.lessons",
    0,
    "student cannot renew access",
  );
  await asUser(admin);
  await db.exec(
    `update public.course_access set expires_at=null,is_active=false where user_id='${student}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from public.courses",
    0,
    "revoked access hides course",
  );
  await asUser(admin);
  await db.exec(
    `update public.course_access set is_active=true where user_id='${student}'; update public.profiles set is_active=false where id='${student}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from public.lessons",
    0,
    "deactivation overrides valid access",
  );
  await db.exec(
    `update public.profiles set is_active=true where id='${student}'`,
  );
  await eq(
    `select is_active from public.profiles where id='${student}'`,
    false,
    "cannot reactivate self",
  );
  await asUser(admin);
  await db.exec(
    `delete from public.course_access where user_id='${student}'; update public.profiles set is_active=true where id='${student}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from public.courses",
    0,
    "admin can remove access",
  );
  await asOwner();
  await db.exec(
    `update public.profiles set is_active=false where id='${admin}'`,
  );
  await asUser(admin);
  await denied(
    `insert into public.courses(title) values ('Inactive admin')`,
    "inactive admin cannot manage",
  );
  await asOwner();
  await db.exec("set role anon");
  for (const table of [
    "profiles",
    "courses",
    "modules",
    "lessons",
    "course_access",
    "lesson_progress",
  ])
    await denied(
      `select * from public.${table}`,
      `anonymous cannot read ${table}`,
    );
  await denied(
    "select private.is_admin()",
    "anonymous cannot call private helpers",
  );
  await asOwner();
  await db.exec(`delete from public.courses where id='${course}'`);
  await eq(
    "select count(*)::integer from public.lesson_progress",
    0,
    "course deletion cascades progress",
  );
  await eq(
    `select count(*)::integer from public.modules where course_id='${course}'`,
    0,
    "course deletion cascades modules",
  );
  // Homework is independently private, including drafts and unlinked uploads.
  await db.exec(`update public.profiles set is_active=true where id='${admin}';
    update public.lessons set homework_pdf_url='storage://homework/assigned.pdf',homework_file_name='Geometry.pdf',homework_uploaded_at=now() where id='${lockedLesson}';
    insert into public.course_access(user_id,course_id) values ('${student}','${locked}');`);
  await asUser(admin);
  await db.exec(
    "insert into storage.objects(bucket_id,name) values ('homework','assigned.pdf'),('homework','unlinked.pdf')",
  );
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework'",
    2,
    "admin can upload homework",
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework'",
    0,
    "enrolled students must use the homework API",
  );
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework' and name='unlinked.pdf'",
    0,
    "guessing PDF path grants no access",
  );
  await denied(
    "insert into storage.objects(bucket_id,name) values ('homework','injected.pdf')",
    "student cannot upload homework",
  );
  await db.exec(
    `update public.lessons set homework_pdf_url='storage://homework/unlinked.pdf' where id='${lockedLesson}'`,
  );
  await eq(
    `select homework_pdf_url from public.lessons where id='${lockedLesson}'`,
    "storage://homework/assigned.pdf",
    "student cannot replace homework",
  );
  await asUser(other);
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework'",
    0,
    "other student cannot read homework",
  );
  await asUser(admin);
  await db.exec(
    `update public.lessons set is_published=false where id='${lockedLesson}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework'",
    0,
    "draft homework inaccessible",
  );
  await asUser(admin);
  await db.exec(
    `update public.lessons set is_published=true where id='${lockedLesson}'; update public.course_access set expires_at=now()-interval '1 second' where user_id='${student}' and course_id='${locked}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework'",
    0,
    "expired grant denies homework",
  );
  await asUser(admin);
  await db.exec(
    `update public.course_access set expires_at=null where user_id='${student}' and course_id='${locked}'; update public.profiles set is_active=false where id='${student}'`,
  );
  await asUser(student);
  await eq(
    "select count(*)::integer from storage.objects where bucket_id='homework'",
    0,
    "inactive profile denies homework",
  );
  await asOwner();
  await assert.rejects(
    () =>
      db.exec(
        `update public.lessons set homework_pdf_url='https://example.test/public.pdf' where id='${lockedLesson}'`,
      ),
    (error) => error.code === "23514",
  );
  checks++;
  await eq(
    "select public from storage.buckets where id='homework'",
    false,
    "homework bucket is private",
  );
  await eq(
    "select file_size_limit::integer from storage.buckets where id='homework'",
    10485760,
    "homework bucket limits file size",
  );
  // Email pre-authorization and student management run against real SQL/RLS.
  const invited = id(70),
    unverified = id(71),
    onboardingCourse = id(72);
  await asOwner();
  await db.exec(`insert into auth.users(id,email,email_confirmed_at) values
    ('${invited}','Invited@Example.test',now()), ('${unverified}','unverified@example.test',null);`);
  await asUser(admin);
  await db.exec(
    `insert into public.courses(id,title,is_published) values ('${onboardingCourse}','Invitation test course',true)`,
  );
  await db.exec(`insert into public.student_invitations(id,email,course_id) values
    ('${id(80)}','invited@example.test','${locked}'), ('${id(81)}','unverified@example.test','${onboardingCourse}');`);
  await asUser(invited);
  await eq(
    "select count(*)::int from public.student_invitations",
    0,
    "invitations hidden from students",
  );
  await denied(
    `insert into public.student_invitations(email,course_id) values ('invited@example.test','${onboardingCourse}')`,
    "student cannot preauthorize themselves",
  );
  await denied(
    `select public.admin_manage_student('${invited}','activate')`,
    "student cannot invoke admin controls",
  );
  await denied(
    `select public.admin_revoke_invitation('${id(80)}')`,
    "student cannot revoke invitations",
  );
  await denied(
    `delete from public.student_invitations where id='${id(80)}'`,
    "students cannot delete invites",
  );
  await asUser(unverified);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    "select count(*)::int from public.course_access",
    0,
    "unverified email cannot claim",
  );
  await asUser(admin);
  await db.exec(`select public.admin_revoke_invitation('${id(81)}')`);
  await asOwner();
  await db.exec(
    `update auth.users set email_confirmed_at=now() where id='${unverified}'`,
  );
  await asUser(unverified);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    "select count(*)::int from public.course_access",
    0,
    "revoked pending email cannot gain access after verification",
  );
  await asUser(other);
  await db.exec("select public.claim_student_invitations()");
  await asOwner();
  await eq(
    `select count(*)::int from public.course_access where user_id='${invited}'`,
    0,
    "another account cannot claim an invitation",
  );
  await asUser(invited);
  await db.exec(
    "select public.claim_student_invitations(); select public.claim_student_invitations();",
  );
  await eq(
    `select count(*)::int from public.course_access where course_id='${locked}'`,
    1,
    "verified case-insensitive email claims exactly once",
  );
  await eq(
    `select count(*)::int from public.courses where id='${locked}'`,
    1,
    "claimed course visible through RLS",
  );
  await asUser(admin);
  await eq(
    `select claimed_by::text from public.student_invitations where id='${id(80)}'`,
    invited,
    "claim records verified user",
  );
  await assert.rejects(
    () =>
      db.exec(
        `insert into public.student_invitations(email,course_id) values ('invited@example.test','${locked}')`,
      ),
    (error) => error.code === "23505",
  );
  checks++;
  await db.exec(`select public.admin_revoke_invitation('${id(80)}')`);
  await asUser(invited);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    "select count(*)::int from public.course_access",
    0,
    "revoking a concurrently claimed invite removes its grant permanently",
  );
  await asUser(admin);
  await db.exec(
    `insert into public.student_invitations(email,course_id) values ('invited@example.test','${locked}')`,
  );
  await asUser(invited);
  await db.exec("select public.claim_student_invitations()");
  await asUser(admin);
  await db.exec(
    `select public.admin_manage_student('${invited}','remove_access', (select id from public.course_access where user_id='${invited}' and course_id='${locked}'))`,
  );
  await asUser(invited);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    "select count(*)::int from public.course_access",
    0,
    "removed access is not restored by later sign-in",
  );
  await asUser(admin);
  await db.exec(`insert into public.course_access(user_id,course_id,is_active,expires_at) values ('${invited}','${onboardingCourse}',false,now()-interval '1 day');
    insert into public.student_invitations(email,course_id) values ('invited@example.test','${onboardingCourse}');`);
  await asUser(invited);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    `select is_active from public.course_access where course_id='${onboardingCourse}'`,
    false,
    "claim never silently reactivates an existing revoked grant",
  );
  await eq(
    `select count(*)::int from public.courses where id='${onboardingCourse}'`,
    0,
    "claim never silently extends expired grants",
  );
  await asUser(admin);
  await db.exec(
    `delete from public.course_access where user_id='${invited}' and course_id='${onboardingCourse}'; select public.admin_revoke_invitation((select id from public.student_invitations where email='invited@example.test' and course_id='${onboardingCourse}'));`,
  );
  await db.exec(`insert into public.course_access(user_id,course_id) values ('${invited}','${locked}');
    insert into public.student_invitations(email,course_id) values ('invited@example.test','${onboardingCourse}');
    select public.admin_manage_student('${invited}','deactivate');`);
  await asUser(invited);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    "select count(*)::int from public.courses",
    0,
    "deactivation blocks existing session immediately",
  );
  await eq(
    "select count(*)::int from public.lessons",
    0,
    "deactivation blocks lessons immediately",
  );
  await eq(
    "select count(*)::int from storage.objects",
    0,
    "deactivation blocks new storage access immediately",
  );
  await asUser(admin);
  await eq(
    "select count(*)::int from public.student_invitations where email='invited@example.test'",
    0,
    "deactivation cancels pending authorizations",
  );
  await db.exec(`select public.admin_manage_student('${invited}','activate')`);
  await asUser(invited);
  await eq(
    `select count(*)::int from public.courses where id='${locked}'`,
    1,
    "activation restores retained grants",
  );
  await asUser(admin);
  await assert.rejects(() =>
    db.exec(
      `select public.admin_manage_student('${invited}','remove_access', (select id from public.course_access where user_id='${student}' limit 1))`,
    ),
  );
  checks++;
  await assert.rejects(() =>
    db.exec(`select public.admin_manage_student('${admin}','deactivate')`),
  );
  checks++;
  // Course access administration: durations, renewal, expiry, and caller checks.
  // Sequential course: order crosses modules and ignores unpublished lessons.
  const seqCourse = id(120),
    seqM1 = id(121),
    seqM2 = id(122),
    seqA = id(123),
    seqB = id(124),
    seqDraft = id(125),
    seqC = id(126);
  await db.exec(`insert into public.courses(id,title,is_published,lesson_unlock_mode) values ('${seqCourse}','Sequential',true,'sequential');
    insert into public.modules(id,course_id,title,position) values ('${seqM1}','${seqCourse}','First',0),('${seqM2}','${seqCourse}','Second',1);
    insert into public.lessons(id,module_id,title,position,is_published,description,video_url,homework_pdf_url) values
      ('${seqA}','${seqM1}','A',0,true,'Secret A',null,null),
      ('${seqDraft}','${seqM1}','Draft',1,false,null,null,null),
      ('${seqB}','${seqM1}','B',2,true,'Secret B','storage://course-media/seq.mp4','storage://homework/seq.pdf'),
      ('${seqC}','${seqM2}','C',0,true,null,null,null);
    insert into storage.objects(bucket_id,name) values ('course-media','seq.mp4'),('homework','seq.pdf');
    insert into public.course_access(user_id,course_id) values ('${invited}','${seqCourse}'),('${other}','${seqCourse}');`);
  await asUser(invited);
  await eq(
    `select public.can_access_lesson('${seqA}')`,
    true,
    "first published lesson unlocks",
  );
  await eq(
    `select public.can_access_lesson('${seqB}')`,
    false,
    "second lesson locked",
  );
  await eq(
    `select count(*)::int from public.lessons where id in ('${seqB}','${seqC}')`,
    0,
    "locked lesson rows and media references hidden by RLS",
  );
  await eq(
    `select count(*)::int from storage.objects where name in ('seq.mp4','seq.pdf')`,
    0,
    "locked video and homework cannot be signed through storage",
  );
  await eq(
    `select jsonb_array_length(public.get_course_curriculum('${seqCourse}')->0->'lessons')`,
    2,
    "safe outline includes published locked titles and excludes drafts",
  );
  await eq(
    `select public.get_course_curriculum('${seqCourse}')->0->'lessons'->1->>'title'`,
    "B",
    "locked title visible in outline",
  );
  await eq(
    `select (public.get_course_curriculum('${seqCourse}')->0->'lessons'->1->>'is_locked')::boolean`,
    true,
    "outline marks locked lesson",
  );
  await eq(
    `select (public.get_course_curriculum('${seqCourse}')->0->'lessons'->1->>'description') is null`,
    true,
    "outline redacts locked description",
  );
  await eq(
    `select (public.get_course_curriculum('${seqCourse}')->0->'lessons'->1) ? 'video_url'`,
    false,
    "outline never exposes video reference",
  );
  await denied(
    `select public.save_lesson_progress('${seqCourse}','${seqB}',null,true)`,
    "cannot complete locked lesson via RPC",
  );
  await denied(
    `select public.save_playback_position('${seqB}',10,now())`,
    "cannot save locked playback",
  );
  await denied(
    `insert into public.lesson_progress(user_id,lesson_id,completed) values ('${invited}','${seqC}',true)`,
    "cannot bypass sequence with direct insert",
  );
  await db.exec(
    `select public.save_lesson_progress('${seqCourse}','${seqA}',null,true)`,
  );
  await eq(
    `select public.can_access_lesson('${seqB}')`,
    true,
    "completion unlocks next lesson despite intervening draft",
  );
  await eq(
    `select count(*)::int from storage.objects where name in ('seq.mp4','seq.pdf')`,
    0,
    "unlocked resources still require server signing",
  );
  await eq(
    `select public.can_access_lesson('${seqC}')`,
    false,
    "next module remains locked",
  );
  await asUser(other);
  await eq(
    `select public.can_access_lesson('${seqB}')`,
    false,
    "another student completion does not unlock",
  );
  await asUser(invited);
  await db.exec(
    `select public.save_lesson_progress('${seqCourse}','${seqB}',null,true)`,
  );
  await eq(
    `select public.can_access_lesson('${seqC}')`,
    true,
    "sequence continues across modules",
  );
  await asUser(admin);
  await db.exec(
    `update public.lessons set is_published=true where id='${seqDraft}'`,
  );
  await asUser(invited);
  await eq(
    `select public.can_access_lesson('${seqC}')`,
    false,
    "newly published earlier lesson requires completion",
  );
  await asUser(admin);
  await db.exec(
    `update public.courses set lesson_unlock_mode='all' where id='${seqCourse}'`,
  );
  await asUser(other);
  await eq(
    `select public.can_access_lesson('${seqC}')`,
    true,
    "all mode unlocks published lessons without completion",
  );
  await asUser(admin);
  await db.exec(
    `update public.courses set lesson_unlock_mode='sequential' where id='${seqCourse}'; select public.admin_move_curriculum_item('module','${seqM2}',-1)`,
  );
  await asUser(other);
  await eq(
    `select public.can_access_lesson('${seqC}')`,
    true,
    "module reorder changes first accessible lesson",
  );
  await eq(
    `select public.can_access_lesson('${seqA}')`,
    false,
    "module reorder relocks later lessons",
  );
  await asUser(admin);
  await db.exec(
    `update public.course_access set expires_at=now()-interval '1 second' where course_id='${seqCourse}' and user_id='${other}'`,
  );
  await asUser(other);
  await denied(
    `select public.get_course_curriculum('${seqCourse}')`,
    "expired students cannot see outline",
  );
  await asUser(admin);
  await db.exec(
    `delete from public.courses where id='${seqCourse}'; delete from storage.objects where name in ('seq.mp4','seq.pdf')`,
  );
  // Both students have access: RLS must still isolate progress ownership.
  const progressCourse = id(110),
    progressModule = id(111),
    progressLesson = id(112);
  await db.exec(`insert into public.courses(id,title,is_published) values ('${progressCourse}','Progress isolation',true);
    insert into public.modules(id,course_id,title) values ('${progressModule}','${progressCourse}','Module');
    insert into public.lessons(id,module_id,title,is_published) values ('${progressLesson}','${progressModule}','Lesson',true);
    insert into public.course_access(user_id,course_id) values ('${invited}','${progressCourse}'),('${other}','${progressCourse}');`);
  await asUser(other);
  await db.exec(
    `select public.save_lesson_progress('${progressCourse}','${progressLesson}',15,false)`,
  );
  await asUser(invited);
  await db.exec(
    `update public.lesson_progress set completed=true where user_id='${other}' and lesson_id='${progressLesson}'`,
  );
  await denied(
    `insert into public.lesson_progress(user_id,lesson_id,completed) values ('${other}','${progressLesson}',true) on conflict(user_id,lesson_id) do update set completed=true`,
    "cannot upsert another enrolled student progress",
  );
  await db.exec(
    `select public.save_lesson_progress('${progressCourse}','${progressLesson}',null,true); select public.save_lesson_progress('${progressCourse}','${progressLesson}',null,true)`,
  );
  await eq(
    `select count(*)::int from public.lesson_progress where lesson_id='${progressLesson}'`,
    1,
    "completion is idempotent and only own progress is visible",
  );
  await asUser(admin);
  await eq(
    `select completed from public.lesson_progress where user_id='${other}' and lesson_id='${progressLesson}'`,
    false,
    "other enrolled student progress remains unchanged",
  );
  await eq(
    `select completed from public.lesson_progress where user_id='${invited}' and lesson_id='${progressLesson}'`,
    true,
    "RPC binds completion to authenticated user",
  );
  await asUser(invited);
  await db.exec(`select public.save_playback_position('${progressLesson}',1123,now()-interval '2 seconds');
    select public.save_playback_position('${progressLesson}',1100,now()-interval '3 seconds');`);
  await eq(
    `select video_progress from public.lesson_progress where lesson_id='${progressLesson}'`,
    1123,
    "late older playback cannot overwrite latest position",
  );
  await eq(
    `select completed from public.lesson_progress where lesson_id='${progressLesson}'`,
    true,
    "playback saves preserve completed state",
  );
  await db.exec(
    `select public.save_playback_position('${progressLesson}',45,now()-interval '1 second')`,
  );
  await eq(
    `select video_progress from public.lesson_progress where lesson_id='${progressLesson}'`,
    45,
    "new backward seek replaces previous position",
  );
  await assert.rejects(() =>
    db.exec(
      `select public.save_playback_position('${progressLesson}',-1,now())`,
    ),
  );
  checks++;
  await assert.rejects(() =>
    db.exec(
      `select public.save_playback_position('${progressLesson}',20,now()+interval '1 day')`,
    ),
  );
  checks++;
  await asUser(admin);
  await eq(
    `select video_progress from public.lesson_progress where user_id='${other}' and lesson_id='${progressLesson}'`,
    15,
    "playback RPC never updates another student",
  );
  await db.exec(
    `update public.course_access set expires_at=now()-interval '1 second' where user_id='${invited}' and course_id='${progressCourse}'`,
  );
  await asUser(invited);
  await denied(
    `select public.save_playback_position('${progressLesson}',100,now())`,
    "expired access cannot save playback",
  );
  await asUser(admin);
  await db.exec(`delete from public.courses where id='${progressCourse}'`);
  // Curriculum edits preserve unique sibling positions.
  const editorCourse = id(100);
  await db.exec(
    `insert into public.courses(id,title) values ('${editorCourse}','Editor course')`,
  );
  const addItem = async (kind, parent, title) =>
    (
      await db.query(
        `select public.admin_add_curriculum_item($1,$2,$3) as id`,
        [kind, parent, title],
      )
    ).rows[0].id;
  const editorModuleA = await addItem("module", editorCourse, "Triangles");
  const editorModuleB = await addItem("module", editorCourse, "Circle");
  const editorLessonA = await addItem("lesson", editorModuleA, "Properties");
  const editorLessonB = await addItem("lesson", editorModuleA, "Pythagoras");
  const editorLessonC = await addItem("lesson", editorModuleB, "Elements");
  await db.exec(`update public.modules set title='Edited module',description='Module description' where id='${editorModuleA}';
    update public.lessons set title='Edited lesson',description='Lesson description',duration=180,video_url='bunny://00000000-0000-4000-8000-000000000123' where id='${editorLessonA}'`);
  await eq(
    `select title='Edited module' and description='Module description' from public.modules where id='${editorModuleA}'`,
    true,
    "admin module edits persist",
  );
  await eq(
    `select title='Edited lesson' and description='Lesson description' and duration=180 from public.lessons where id='${editorLessonA}'`,
    true,
    "admin lesson edits persist",
  );
  await eq(
    `select position from public.modules where id='${editorModuleB}'`,
    1,
    "new modules append",
  );
  await eq(
    `select is_published from public.lessons where id='${editorLessonA}'`,
    false,
    "new lessons are drafts",
  );
  await db.exec(
    `select public.admin_move_curriculum_item('module','${editorModuleB}',-1)`,
  );
  await eq(
    `select position from public.modules where id='${editorModuleB}'`,
    0,
    "modules swap atomically",
  );
  await db.exec(
    `select public.admin_move_curriculum_item('lesson','${editorLessonB}',-1)`,
  );
  await eq(
    `select position from public.lessons where id='${editorLessonB}'`,
    0,
    "lessons reorder within module",
  );
  await eq(
    `select position from public.lessons where id='${editorLessonC}'`,
    0,
    "other module unchanged",
  );
  await db.exec(
    `select public.admin_move_curriculum_item('lesson','${editorLessonB}',-1)`,
  );
  await eq(
    `select position from public.lessons where id='${editorLessonB}'`,
    0,
    "first item move is no-op",
  );
  await db.exec(
    `select public.admin_move_curriculum_item('lesson','${editorLessonB}',1)`,
  );
  await eq(
    `select position from public.lessons where id='${editorLessonB}'`,
    1,
    "lesson moves down",
  );
  await assert.rejects(() =>
    db.exec(
      `select public.admin_move_curriculum_item('lesson','${editorLessonB}',0)`,
    ),
  );
  checks++;
  await assert.rejects(() =>
    db.exec(
      `select public.admin_add_curriculum_item('lesson','${id(999)}','Missing')`,
    ),
  );
  checks++;
  await assert.rejects(() =>
    db.exec(
      `select public.admin_add_curriculum_item('module','${editorCourse}',' ')`,
    ),
  );
  checks++;
  await asUser(invited);
  await denied(
    `select public.admin_add_curriculum_item('module','${editorCourse}','Unauthorized')`,
    "student cannot create curriculum",
  );
  await denied(
    `select public.admin_move_curriculum_item('module','${editorModuleA}',1)`,
    "student cannot reorder curriculum",
  );
  await asUser(admin);
  await db.exec(`delete from public.modules where id='${editorModuleA}'`);
  await eq(
    `select count(*)::int from public.lessons where id in ('${editorLessonA}','${editorLessonB}')`,
    0,
    "module deletion cascades lessons",
  );
  await db.exec(`delete from public.courses where id='${editorCourse}'`);
  await eq(
    `select count(*)::int from public.modules where course_id='${editorCourse}'`,
    0,
    "course deletion cascades modules",
  );
  await eq(
    `select count(*)::int from public.lessons where id='${editorLessonC}'`,
    0,
    "course deletion cascades all lessons",
  );
  for (const days of [30, 60, 90]) {
    await db.exec(
      `begin; select public.admin_set_course_access('${invited}','${locked}','${days}');`,
    );
    await eq(
      `select expires_at = now() + interval '${days} days' from public.course_access where user_id='${invited}' and course_id='${locked}'`,
      true,
      `${days}-day grant uses database time`,
    );
    await db.exec("commit");
  }
  await eq(
    `select count(*)::int from public.course_access where user_id='${invited}' and course_id='${locked}'`,
    1,
    "renewal preserves one grant per course",
  );
  await db.exec(
    `select public.admin_set_course_access('${invited}','${locked}','custom','2099-01-15')`,
  );
  await eq(
    `select expires_at = '2099-01-15 19:00:00+00'::timestamptz from public.course_access where user_id='${invited}' and course_id='${locked}'`,
    true,
    "custom date includes full Kazakhstan day",
  );
  for (const mode of [
    "'custom','2020-01-01'",
    "'custom',null",
    "'custom','infinity'",
    "'365',null",
    "null,null",
  ]) {
    await assert.rejects(() =>
      db.exec(
        `select public.admin_set_course_access('${invited}','${locked}',${mode})`,
      ),
    );
    checks++;
  }
  await assert.rejects(() =>
    db.exec(
      `select public.admin_set_course_access('${admin}','${locked}','none')`,
    ),
  );
  checks++;
  await assert.rejects(() =>
    db.exec(
      `select public.admin_set_course_access('${invited}','${id(999)}','none')`,
    ),
  );
  checks++;
  await db.exec(
    `select public.admin_set_course_access('${invited}','${locked}','none')`,
  );
  await eq(
    `select expires_at is null and is_active from public.course_access where user_id='${invited}' and course_id='${locked}'`,
    true,
    "indefinite access clears previous expiration",
  );
  await asUser(invited);
  await denied(
    `select public.admin_set_course_access('${invited}','${locked}','none')`,
    "student cannot grant or extend access via RPC",
  );
  await denied(
    `select public.admin_set_course_access('${other}','${locked}','remove')`,
    "student cannot remove another student access",
  );
  await db.exec(
    `insert into public.lesson_progress(user_id,lesson_id,completed) values ('${invited}','${lockedLesson}',true)`,
  );
  await asUser(admin);
  await db.exec(
    `begin; update public.course_access set expires_at=now() where user_id='${invited}' and course_id='${locked}';`,
  );
  await asUser(invited);
  await eq(
    `select count(*)::int from public.courses where id='${locked}'`,
    0,
    "expiration equality denies course via RLS",
  );
  await eq(
    `select count(*)::int from public.lessons where id='${lockedLesson}'`,
    0,
    "expiration denies lessons via RLS",
  );
  await eq(
    `select count(*)::int from public.lesson_progress`,
    0,
    "expiration denies progress via RLS",
  );
  await eq(
    `select count(*)::int from storage.objects`,
    0,
    "expiration denies new storage requests",
  );
  await db.exec("commit");
  await asUser(admin);
  await db.exec(
    `select public.admin_set_course_access('${invited}','${locked}','60')`,
  );
  await asUser(invited);
  await eq(
    `select count(*)::int from public.lesson_progress`,
    1,
    "renewal restores saved progress",
  );
  await asUser(admin);
  await db.exec(
    `insert into public.student_invitations(email,course_id) values ('invited@example.test','${locked}'); select public.admin_set_course_access('${invited}','${locked}','remove')`,
  );
  await eq(
    `select count(*)::int from public.student_invitations where email='invited@example.test' and course_id='${locked}'`,
    0,
    "removal clears pending grants",
  );
  await asUser(invited);
  await db.exec("select public.claim_student_invitations()");
  await eq(
    `select count(*)::int from public.courses where id='${locked}'`,
    0,
    "removed grant cannot be reclaimed",
  );
  await asUser(admin);
  await eq(
    `select count(*)::int from public.lesson_progress where user_id='${invited}'`,
    1,
    "access removal retains learning progress",
  );
  await db.exec(
    `select public.admin_manage_student('${invited}','deactivate'); select public.admin_set_course_access('${invited}','${locked}','none')`,
  );
  await asUser(invited);
  await eq(
    `select count(*)::int from public.courses`,
    0,
    "grant does not reactivate student",
  );
  await asOwner();
  await db.exec(
    `update public.profiles set is_active=false where id='${admin}'`,
  );
  await asUser(admin);
  await denied(
    `select public.admin_manage_student('${invited}','deactivate')`,
    "inactive admin cannot manage students",
  );
  await denied(
    `select public.admin_revoke_invitation('${id(81)}')`,
    "inactive admin cannot revoke pending emails",
  );
  await denied(
    `select public.admin_set_course_access('${invited}','${locked}','none')`,
    "inactive admin cannot grant course access",
  );
  await asOwner();
  await db.exec("set role anon");
  await denied(
    `select public.admin_set_course_access('${invited}','${locked}','none')`,
    "anonymous cannot grant course access",
  );
  await denied(
    "select public.claim_student_invitations()",
    "anonymous cannot claim email authorization",
  );
  // Direct Data API clients must not bypass verified identity checks.
  await asOwner();
  const securityUser = id(900),
    securityCourse = id(901),
    securityModule = id(902),
    securityLesson = id(903);
  await db.exec(
    `insert into public.courses(id,title,is_published) values ('${securityCourse}','Security',true); insert into public.modules(id,course_id,title) values ('${securityModule}','${securityCourse}','Module'); insert into public.lessons(id,module_id,title,is_published) values ('${securityLesson}','${securityModule}','Lesson',true)`,
  );
  await db.exec(`insert into auth.users(id,email) values ('${securityUser}','security@example.test');
    insert into public.course_access(user_id,course_id) values ('${securityUser}','${securityCourse}');`);
  await asUser(securityUser);
  await eq(
    `select count(*)::int from public.courses`,
    0,
    "unverified enrolled identity denied by RLS",
  );
  await denied(
    `select public.get_course_curriculum('${securityCourse}')`,
    "unverified curriculum denied",
  );
  await denied(
    `select public.save_lesson_progress('${securityCourse}','${securityLesson}',0,true)`,
    "unverified progress denied",
  );
  await asOwner();
  await db.exec(
    `update auth.users set email_confirmed_at=now() where id='${securityUser}'`,
  );
  await asUser(securityUser);
  await eq(
    `select count(*)::int from public.courses where id='${securityCourse}'`,
    1,
    "verified enrolled identity permitted",
  );
  await asOwner();
  await db.exec(
    `update public.profiles set email='mismatch@example.test' where id='${securityUser}'`,
  );
  await asUser(securityUser);
  await eq(
    `select count(*)::int from public.courses`,
    0,
    "profile email mismatch denied by RLS",
  );
  await asOwner();
  await db.exec(`update public.profiles set email='security@example.test' where id='${securityUser}';
    update auth.users set email_confirmed_at=null where id='${securityUser}'`);
  await asUser(securityUser);
  await denied(
    `select public.admin_set_course_access('${student}','${securityCourse}','none')`,
    "unverified administrator cannot grant access",
  );
  await denied(
    `insert into public.courses(title) values ('Forged')`,
    "unverified administrator cannot create content",
  );
  await asOwner();
  await db.exec(`update public.profiles set role='student' where id='${securityUser}';
    update auth.users set email_confirmed_at=now() where id='${securityUser}';
    create policy unrelated_storage_read on storage.objects for select to authenticated using (true);`);
  await asUser(securityUser);
  await eq(
    `select count(*)::int from storage.objects where bucket_id in ('homework','course-media')`,
    0,
    "restrictive guard prevents permissive policy signing bypass",
  );
  await asOwner();
  await denied(
    `update public.profiles set role='admin' where id='${securityUser}'`,
    "even direct database writes cannot appoint another admin",
  );
  await db.exec(
    `update public.profiles set is_active=true where id='${admin}'`,
  );
  await asUser(admin);
  await eq(
    `select count(*)::int > 0 from storage.objects where bucket_id='homework'`,
    true,
    "verified administrator retains Storage management",
  );
  await denied(
    `update public.profiles set role='admin' where id='${student}'`,
    "owner cannot appoint another admin",
  );
  await asUser(student);
  await denied(
    "select public.claim_owner_admin()",
    "student cannot claim owner privileges",
  );
  await asOwner();
  await db.exec(
    `update public.profiles set role='student' where id='${admin}'`,
  );
  await asUser(admin);
  await db.exec("select public.claim_owner_admin()");
  await eq(
    "select private.is_admin()",
    true,
    "Google owner claims admin without enrollment",
  );
  await asOwner();
  await db.exec(
    `update public.profiles set role='student', is_active=false where id='${admin}'`,
  );
  await asUser(admin);
  await db.exec("select public.claim_owner_admin()");
  await eq(
    "select private.is_admin()",
    false,
    "claim never reactivates disabled owner",
  );
  await asOwner();
  await db.exec(`update public.profiles set is_active=true where id='${admin}';
    update auth.identities set provider='email' where user_id='${admin}'`);
  await asUser(admin);
  await denied(
    "select public.claim_owner_admin()",
    "matching email without Google is insufficient",
  );
  await asOwner();
  await db.exec(
    `update auth.identities set provider='google', identity_data='{"email":"qazbek03@gmail.com","email_verified":false}' where user_id='${admin}'`,
  );
  await asUser(admin);
  await denied(
    "select public.claim_owner_admin()",
    "unverified Google identity denied",
  );
  await asOwner();
  await db.exec(
    `update auth.identities set identity_data='{"email":"qazbek03@gmail.com","email_verified":true}' where user_id='${admin}'`,
  );
  await asUser(admin);
  await db.exec("select public.claim_owner_admin()");
  await asOwner();
  await db.exec(`delete from auth.identities where user_id='${admin}'`);
  await asUser(admin);
  await eq(
    "select private.is_admin()",
    false,
    "removing Google identity revokes admin despite stored role",
  );
  await asOwner();
  await db.exec("set role anon");
  await denied(
    "select public.claim_owner_admin()",
    "anonymous cannot claim owner privileges",
  );
  console.log(`Database migration and ${checks} security checks passed.`);
} finally {
  await db.close();
}
