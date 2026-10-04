# Database boundary

Server-only dashboard and lesson queries live here. Use the cookie-aware client from `@/lib/supabase/server` for authorization and database queries. Never expose a service-role key to the browser.

Apply all migrations in `supabase/migrations/` before authenticated use; see `supabase/README.md` for setup, administrator bootstrap, access rules, and security checks. Application tables use RLS. Roles and account activity come from `profiles`, not JWT metadata.

Migration 010 blocks direct student Storage access. Private media APIs authorize the published lesson and current enrollment with the user's client, then sign its stored reference through the server-only signing client. Admin uploads continue to use the administrator's cookie client and RLS. UI route guards are not database authorization.
