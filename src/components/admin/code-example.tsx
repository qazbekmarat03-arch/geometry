"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CodeExample({ title, code }: { title: string; code: string }) {
  const field = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  return (
    <div className="my-4 min-w-0 rounded-2xl border border-line p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              toast({ message: "Код көшірілді" });
            } catch {
              field.current?.focus();
              field.current?.select();
              toast({
                message:
                  "Код белгіленді. Көшіру мәзірін немесе Ctrl+C қолданыңыз.",
              });
            }
          }}
        >
          Кодты көшіру
        </Button>
      </div>
      <textarea
        ref={field}
        aria-label={title}
        readOnly
        value={code}
        rows={10}
        spellCheck={false}
        className="premium-input block w-full font-mono text-sm"
      />
    </div>
  );
}
