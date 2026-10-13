import type { ReactNode } from "react";
import { StudentShell } from "@/components/dashboard/student-shell";
export function AdminShell({ children }: { children: ReactNode }) {
  return <StudentShell admin>{children}</StudentShell>;
}
