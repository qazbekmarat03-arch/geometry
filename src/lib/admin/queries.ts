import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type Student = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

export async function getAdminOverview() {
  await requireAdmin();
  const db = await createClient();
  const results = await Promise.all([
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true),
    db.from("courses").select("id", { count: "exact", head: true }),
    db.from("lessons").select("id", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("id,full_name,email,is_active,created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .order("id")
      .limit(8),
  ]);
  if (results.some((result) => result.error))
    throw new Error("Admin overview could not be loaded.");
  return {
    students: results[0].count ?? 0,
    activeStudents: results[1].count ?? 0,
    courses: results[2].count ?? 0,
    lessons: results[3].count ?? 0,
    recentStudents: (results[4].data ?? []) as Student[],
  };
}
