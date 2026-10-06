"use client";
import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Input({
  label,
  error,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-[11px] font-medium tracking-wide text-muted"
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : props["aria-describedby"]
        }
        className={cn(
          "min-h-12 w-full rounded-xl border border-line bg-surface px-4 py-3 text-[13px] transition-colors placeholder:text-muted/70 focus:border-brand/40 disabled:opacity-50",
          error && "border-red-500",
          className,
        )}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
