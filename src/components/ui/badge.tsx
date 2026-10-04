import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-brand/10 bg-brand-light px-2.5 py-1.5 text-[10px] font-medium tracking-wide text-brand",
        className,
      )}
      {...props}
    />
  );
}
