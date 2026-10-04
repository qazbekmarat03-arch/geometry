import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-installation flex min-h-[280px] flex-col items-center justify-center text-center">
      <svg
        viewBox="0 0 100 80"
        className="mb-7 h-20 w-24 text-brand"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="40"
          r="30"
          stroke="currentColor"
          strokeWidth=".6"
          opacity=".3"
        />
        <path
          d="m20 61 30-48 30 48H20Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M50 13v58M12 40h76"
          stroke="currentColor"
          strokeWidth=".5"
          strokeDasharray="2 4"
          opacity=".4"
        />
        <circle cx="50" cy="40" r="3" fill="currentColor" />
      </svg>
      <h2 className="max-w-lg text-xl font-medium tracking-tight sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-sm text-[13px] leading-7 text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-7">{action}</div>}
      <ArrowUpRight className="absolute right-7 top-7 text-ink/20" size={19} />
    </div>
  );
}
