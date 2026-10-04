import { requireUser } from "@/lib/auth/session";
import { StudentShell } from "@/components/dashboard/student-shell";
export const dynamic = "force-dynamic";
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <StudentShell>{children}</StudentShell>;
}
