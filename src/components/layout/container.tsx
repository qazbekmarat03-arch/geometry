import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1392px] px-6 sm:px-10 lg:px-14",
        className,
      )}
      {...props}
    />
  );
}
