"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function DashboardError({ reset }: { reset: () => void }) {
  return <ErrorState reset={reset} />;
}
