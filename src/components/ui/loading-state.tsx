import { LoaderCircle } from "lucide-react";
export function LoadingState({ label = "Жүктелуде..." }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted"
    >
      <LoaderCircle
        className="animate-spin text-brand motion-reduce:animate-none"
        size={22}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
