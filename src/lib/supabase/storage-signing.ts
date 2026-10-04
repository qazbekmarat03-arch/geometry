import "server-only";
import { createClient } from "@supabase/supabase-js";

// This privileged client is ONLY for signing an already-authorized, stored media
// reference. Never use it for normal queries, authorization, or browser input.
export function createStorageSigningClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Private media signing is not configured.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
