"use client";
import { useState } from "react";
import { Download, ExternalLink, LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export function HomeworkCard({
  lessonId,
  fileName,
  uploadedAt,
  available,
}: {
  lessonId: string;
  fileName: string | null;
  uploadedAt: string | null;
  available: boolean;
}) {
  const [pending, setPending] = useState<"open" | "download" | null>(null);
  const [error, setError] = useState("");
  async function requestPdf(mode: "open" | "download") {
    setPending(mode);
    setError("");
    // Open synchronously to avoid popup blocking while authorization is pending.
    const target =
      mode === "open" ? window.open("about:blank", "_blank") : null;
    if (target) target.opener = null;
    try {
      const response = await fetch(
        `/api/lessons/${encodeURIComponent(lessonId)}/homework${mode === "download" ? "?download=1" : ""}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok || !result.url)
        throw new Error(result.error || "PDF жүктелмеді.");
      if (mode === "open") {
        if (target) target.location.replace(result.url);
        else window.location.assign(result.url);
      } else {
        const link = document.createElement("a");
        link.href = result.url;
        link.download = fileName || "homework.pdf";
        link.rel = "noopener noreferrer";
        document.body.append(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      target?.close();
      setError(err instanceof Error ? err.message : "PDF жүктелмеді.");
    } finally {
      setPending(null);
    }
  }
  return (
    <Card className="homework-document relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="pdf-sheet" aria-hidden="true">
          <span>D / PDF</span>
          <svg viewBox="0 0 70 50" fill="none">
            <path d="M6 44 35 4 64 44Z M35 4v40" stroke="#638264" />
            <circle cx="35" cy="28" r="21" stroke="#bdc9b5" strokeWidth=".6" />
          </svg>
          <span>ПРАКТИКА</span>
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-[9px] tracking-[.16em] text-muted">
            САБАҚТЫ БЕКІТУ / PDF
          </p>
          <h3 className="text-2xl font-medium tracking-tight">Үй тапсырмасы</h3>
          <p className="mt-2 break-words text-sm text-muted">
            {available
              ? fileName || "Сабақ тапсырмасы.pdf"
              : "Бұл сабаққа PDF тапсырмасы әлі қосылмаған."}
          </p>
          {available && uploadedAt && (
            <p className="mt-1 text-xs text-muted">
              Жүктелген күні:{" "}
              {new Intl.DateTimeFormat("kk-KZ", {
                dateStyle: "medium",
                timeZone: "Asia/Almaty",
              }).format(new Date(uploadedAt))}
            </p>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={!available || !!pending}
          onClick={() => void requestPdf("open")}
        >
          {pending === "open" ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ExternalLink size={16} />
          )}
          PDF ашу<span className="sr-only"> — жаңа бетте</span>
        </Button>
        <Button
          disabled={!available || !!pending}
          onClick={() => void requestPdf("download")}
        >
          {pending === "download" ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          PDF жүктеу
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </Card>
  );
}
