"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-20">
      <ErrorState reset={reset} />
    </main>
  );
}
