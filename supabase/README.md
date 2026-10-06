# DURYSTAP database

Apply all files in `migrations/` in filename order to your Supabase project as the database owner. The fifth migration adds single-use email pre-authorizations and student administration functions; see [student administration](STUDENT_ADMINISTRATION.md). The sixth adds admin course grants, renewal, and expiration controls; see [course access](COURSE_ACCESS.md). These migrations have not been applied to a hosted project by this repository change.

## Apply

For a new project, paste each complete migration into the Supabase SQL Editor and run each once, in filename order. Alternatively, use the Supabase CLI migration workflow:

```sh
supabase login
supabase init
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Choose one workflow; do not run the same migration again through the other workflow without reconciling migration history. Back up an existing project first and review any existing tables with these names. This migration intentionally fails on conflicting table names instead of overwriting existing data.

Keep the `private` schema out of Supabase's exposed API schemas. Application tables belong in `public` with RLS enabled. Configure `.env.local` using the root README. Private media signing requires a server-only SUPABASE_SERVICE_ROLE_KEY. Application queries and authorization still use the cookie-scoped client and RLS. Apply migration 010 and see [security review](SECURITY_REVIEW.md).

## Sole administrator

Apply `20261004001100_single_google_admin.sql`, then sign in with **qazbek03@gmail.com** through Google. The server calls `claim_owner_admin()` with no arguments. Only the currently authenticated owner with a confirmed Auth email and a matching verified Google identity can claim this role. The RPC never reactivates an inactive profile. Other accounts cannot appoint themselves or another user.

The migration demotes former administrators outside the owner identity. RLS checks both the database role and the verified owner identity on every request. A profile trigger also rejects attempts to give another account the admin role. New Auth users default to `student`; signup metadata cannot set roles. The invitation-claim RPC remains limited to existing administrator-issued course authorizations.

## Access rules

| Entity          | Student                                                                                | Active administrator                                                |
| --------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| profiles        | Read own profile, including inactive status; no writes                                 | Read profiles and update activity; cannot appoint another admin     |
| courses         | Read published courses with active, unexpired access                                   | Create, read, update, delete                                        |
| modules         | Read only inside an accessible published course                                        | Create, read, update, delete                                        |
| lessons         | Read published lessons inside an accessible published course                           | Create, read, update, delete                                        |
| course_access   | Read own records while profile is active; **no writes**                                | Grant, renew, revoke, or delete access                              |
| lesson_progress | Read/insert own progress for accessible lessons; update only completed/playback fields | Read progress; same ownership restrictions for writing own progress |

All anonymous table access is denied. Inactive profiles lose content and progress access immediately on subsequent database requests, even with an existing session. An inactive user can still read their own profile status. Admin powers also require `is_active = true`.

Course access requires `is_active = true` and either `expires_at IS NULL` or `expires_at > now()`. Publication is checked at both course and lesson level. Hiding a course hides all its modules and lessons. Progress is retained after revocation but inaccessible to the student until access is restored.

Students have no profile write policy and no course-access mutation policy, so self-promotion, reactivation, self-enrollment, renewal, and granting another user access are blocked by RLS, including upserts. The service role and database owner bypass RLS by design; never expose them in browser code.

## Data conventions

- IDs are UUIDs. Profiles use the Auth user UUID. All other IDs default to generated UUIDs.
- Timestamps use `timestamptz`. `expires_at = NULL` means indefinite access.
- `duration` and `video_progress` are nonnegative integer seconds.
- Module/lesson positions are nonnegative and unique within their parent. Reordering multiple siblings can defer the unique constraint inside a transaction.
- One access record per user/course and one progress record per user/lesson; update the existing record to renew access or save playback.
- Progress `updated_at` is database-controlled on inserts and updates. Browser updates may change only `completed` and `video_progress`.
- Parent deletions cascade. Deleting a course removes modules, lessons, access records, and related progress. Use `is_published = false` to hide content while retaining data, or `is_active = false` to revoke a grant.
- Foreign keys are indexed by the parent/position or user/content unique indexes, plus indexes for course-based access lookup and lesson-based progress lookup.

## Video and PDF storage

`video_url` and `homework_pdf_url` are nullable text fields for protected provider URLs or private storage object paths. RLS protects database rows, not publicly hosted files. The second migration creates the private course-media bucket, its Storage policies, and the atomic save_lesson_progress RPC. Apply migrations in filename order. Do not persist permanent public links or long-lived signed links for paid content.

## Security regression checks

```sh
npm run test:db
```

The test runs the actual SQL migration in an isolated PGlite PostgreSQL instance, with minimal mock Supabase Auth tables, roles, and `auth.uid()`. It switches to real `authenticated`/`anon` database roles to exercise RLS, grants, Auth triggers, publication, expiration, deactivation, progress ownership, and cascades. Nothing is written to your hosted database. Google OAuth, PostgREST, and Storage need separate integration checks against a configured Supabase project.

Policy patterns follow [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Auth user management](https://supabase.com/docs/guides/auth/managing-user-data).
