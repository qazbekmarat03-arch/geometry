"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
async function clearSession() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("Шығу мүмкін болмады. Қайта көріңіз.");
  revalidatePath("/", "layout");
}
export async function signOut() {
  await clearSession();
  redirect("/");
}
export async function switchAccount() {
  await clearSession();
  redirect("/login");
}
