import { StudentShell } from "@/components/dashboard/student-shell";
export const dynamic = "force-dynamic";
export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentShell>{children}</StudentShell>;
}
