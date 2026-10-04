import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";
type Variant = "primary" | "secondary" | "ghost";
const variants: Record<Variant, string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  ghost: "button-ghost",
};
export function buttonStyles(variant: Variant = "primary", className?: string) {
  return cn(
    "premium-button inline-flex min-h-12 items-center justify-center gap-3 px-5 py-3 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    className,
  );
}
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, className)}
      {...props}
    />
  );
}
export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonStyles(variant, className)} {...props} />;
}
