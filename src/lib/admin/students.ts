import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "./queries";

export type StudentAccess = {
  id: string;
  course_id: string;
  is_active: boolean;
  expires_at: string | null;
  courses: { title: string; is_published: boolean } | null;
};
export type StudentDetails = Student & { course_access: StudentAccess[] };
export type Invitation = {
  id: string;
  email: string;
  created_at: string;
  courses: { title: string } | null;
};
export const studentSelection =
  "id,full_name,email,is_active,created_at,course_access(id,course_id,is_active,expires_at,courses(title,is_published))";

export async function getStudents({
  query,
  page,
  activeOnly,
  pendingPage,
}: {
  query: string;
  page: number;
  activeOnly: boolean;
  pendingPage: number;
}) {
  await requireAdmin();
  const db = await createClient();
  // Use quoted PostgREST values and escape LIKE wildcards so searches remain literal.
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  let studentsQuery = db
    .from("profiles")
    .select(studentSelection, { count: "exact" })
    .eq("role", "student");
  let invitationsQuery = db
    .from("student_invitations")
    .select("id,email,created_at,courses(title)", { count: "exact" })
    .is("claimed_by", null);
  if (query) {
    studentsQuery = studentsQuery.or(
      `full_name.ilike.${JSON.stringify(pattern)},email.ilike.${JSON.stringify(pattern)}`,
    );
    invitationsQuery = invitationsQuery.ilike("email", pattern);
  }
  if (activeOnly) studentsQuery = studentsQuery.eq("is_active", true);
  const [students, invitations, courses] = await Promise.all([
    studentsQuery
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1),
    invitationsQuery
      .order("created_at", { ascending: false })
      .order("id")
      .range((pendingPage - 1) * 20, pendingPage * 20 - 1),
    db.from("courses").select("id,title").order("title").limit(1000),
  ]);
  if (students.error || invitations.error || courses.error)
    throw new Error("Students could not be loaded.");
  return {
    students: students.data as unknown as StudentDetails[],
    total: students.count ?? 0,
    invitations: invitations.data as unknown as Invitation[],
    pendingTotal: invitations.count ?? 0,
    courses: courses.data as { id: string; title: string }[],
  };
}

export function courseAccessLabel(
  access: StudentAccess,
  studentActive: boolean,
  now: number,
) {
  if (!access.is_active) return "Тоқтатылған";
  if (access.expires_at && new Date(access.expires_at).getTime() <= now)
    return "Мерзімі өткен";
  if (!studentActive) return "Аккаунт белсенді емес";
  if (!access.courses?.is_published) return "Курс жарияланбаған";
  return "Қолжетімді";
}
