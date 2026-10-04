"use client";
import { useFormStatus } from "react-dom";
import { Button } from "./button";
export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? "Жүктелуде..." : children}
    </Button>
  );
}
