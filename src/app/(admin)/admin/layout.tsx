import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
