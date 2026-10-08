// Real PostgreSQL execution via PGlite. Only Supabase's Auth scaffolding is mocked.
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
let checks = 0;
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const legacy = id(4);
async function eq(sql, expected, label) {
  const result = await db.query(sql);
  assert.equal(Object.values(result.rows[0])[0], expected, label);
  checks++;
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

  await db.exec(`
    insert into courses(id,title,is_published) values ('d0946411-042a-4399-85ed-bb860a46abf2','Original course',true);
    insert into modules(id,course_id,title,position) values ('0bcb4654-8fe5-48b9-8cf2-3e203248bc45','d0946411-042a-4399-85ed-bb860a46abf2','Original module',0);
    insert into lessons(id,module_id,title,position,is_published,video_url) values ('67e4a08a-0bfc-4103-93da-fefaf0fdbca0','0bcb4654-8fe5-48b9-8cf2-3e203248bc45','Original lesson',0,true,'youtube://UdFm-e6bwIc');
  `);
  const seed = await readFile(new URL('../supabase/seeds/20261009-curriculum.sql',import.meta.url),'utf8');
  await db.exec(seed);
  await db.exec(seed);
  await eq('select count(*)::int from courses',3,'three courses');
  await eq('select count(*)::int from modules',39,'39 modules');
  await eq('select count(*)::int from lessons',160,'160 lessons, repeat safe');
  await eq('select count(*)::int from lessons where not is_published',159,'new lessons remain drafts');
  await eq("select video_url from lessons where id='67e4a08a-0bfc-4103-93da-fefaf0fdbca0'",'youtube://UdFm-e6bwIc','existing video preserved');
  await eq("select position from lessons where id='67e4a08a-0bfc-4103-93da-fefaf0fdbca0'",1,'existing lesson correctly reordered');
  const curriculum=JSON.parse(await readFile(new URL('../supabase/seeds/20261009-curriculum.json',import.meta.url),'utf8'));
  for(const c of curriculum) {
    for(const [mi,m] of c.modules.entries()) {
      await eq(`select position from modules where id='${m.id}'`,mi,'module order');
      for(const [li,l] of m.lessons.entries()) {
        await eq(`select position from lessons where id='${l.id}'`,li,'lesson order');
      }
    }
  }
  console.log(`Curriculum: ${checks} checks passed, with all production migrations and two imports.`);
} finally { await db.close(); }
