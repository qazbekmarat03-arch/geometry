"use client";
import { AlertCircle } from "lucide-react";
import { Card } from "./card";
import { Button } from "./button";
export function ErrorState({ reset }: { reset: () => void }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <AlertCircle size={30} className="mb-5 text-brand" aria-hidden="true" />
      <h2 className="text-xl font-semibold">Қате орын алды</h2>
      <p className="mb-6 mt-3 max-w-md text-sm leading-6 text-muted">
        Деректерді жүктеу мүмкін болмады. Байланысты тексеріп, қайта көріңіз.
      </p>
      <Button onClick={reset}>Қайта көріңіз</Button>
    </Card>
  );
}
