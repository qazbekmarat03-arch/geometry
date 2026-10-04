import { getDashboardData } from "@/lib/db/dashboard";
import { ProgressView } from "@/components/dashboard/progress-view";
export const metadata = { title: "Прогресс" };
export default async function ProgressPage() {
  return <ProgressView data={await getDashboardData()} />;
}
