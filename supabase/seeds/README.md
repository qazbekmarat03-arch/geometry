# Owner curriculum — 9 October 2026

`20261009-curriculum.sql` prepares 3 courses, 39 modules and 160 lessons:

| Course | Modules | Lessons |
| --- | ---: | ---: |
| Алгебра | 19 | 98 |
| Геометрия | 18 | 37 |
| Аналитикалық геометрия | 2 | 25 |

The owner document says 96 algebra lessons, but lists 98. All listed lessons are retained. The triangles module uses the owner’s replacement list of nine lessons.

This is an explicit content import, not a schema migration. Run the SQL as postgres in the intended Supabase project's SQL Editor. It reuses the existing production geometry course, introductory module and angles lesson by ID, retaining media, publication flags, access grants and progress. All new courses and lessons start unpublished. Existing unrelated content is never deleted; order conflicts cause the transaction to roll back.

The JSON file is the readable curriculum reference. The SQL contains the same data so it can be pasted directly into the editor. Re-running restores the supplied titles and order without duplicating IDs; do not rerun after intentionally changing those titles/orders.

Validation: `node scripts/verify-curriculum.mjs` executes all schema migrations in isolated PGlite, imports twice, and checks counts, ordering, draft state and existing video preservation. No credentials or production network access are used by this check.
