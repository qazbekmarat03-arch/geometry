import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  accessDestination,
  getAccountAccess,
  type AccountAccess,
} from "./access";

// React cache deduplicates within one render, never across users or requests.
export const getSessionAccess = cache(async (): Promise<AccountAccess> => {
  if (!getSupabaseConfig()) return { status: "signed-out" };
  return getAccountAccess(await createClient());
});

export async function requireUser() {
  const access = await getSessionAccess();
  if (access.status === "signed-out") redirect("/login");
  if (access.status === "denied") redirect("/access-denied");
  return access.user;
}

export async function requireAdmin() {
  const access = await getSessionAccess();
  if (access.status !== "admin") redirect(accessDestination(access));
  return access.user;
}
