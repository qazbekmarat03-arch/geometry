import { cn } from "@/lib/utils";
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-surface rounded-lg bg-[#e9ece2] motion-reduce:animate-none",
        className,
      )}
    />
  );
}
export function PageSkeleton({
  kind = "dashboard",
}: {
  kind?: "dashboard" | "course" | "form";
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Жүктелуде...</span>
      <Skeleton className="mb-6 h-2 w-32" />
      <Skeleton className="mb-4 h-12 w-3/4 max-w-lg" />
      <Skeleton className="mb-12 h-3 w-2/3 max-w-sm" />
      {kind === "dashboard" ? (
        <>
          <div className="dashboard-stage">
            <div className="relative min-h-72 overflow-hidden rounded-[24px] bg-[#e7ebdf] p-9">
              <div className="absolute -right-12 top-6 size-64 rounded-full border border-[#ced7c6]" />
              <Skeleton className="mb-6 h-2 w-24" />
              <Skeleton className="mb-4 h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-12 h-11 w-32" />
            </div>
            <div className="py-8">
              <Skeleton className="h-20 w-28" />
              <Skeleton className="mt-8 h-1 w-full" />
              <Skeleton className="mt-4 h-3 w-2/3" />
            </div>
          </div>
          <div className="course-gallery">
            <Skeleton className="aspect-[1.8] w-full rounded-[20px]" />
            <Skeleton className="aspect-[1.8] w-full rounded-[20px]" />
          </div>
        </>
      ) : kind === "course" ? (
        <div className="lesson-layout">
          <div className="hidden w-full space-y-8 md:block">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="mb-3 h-5 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ))}
          </div>
          <div className="w-full">
            <Skeleton className="aspect-video w-full rounded-[20px]" />
            <Skeleton className="mt-6 h-10 w-40" />
          </div>
        </div>
      ) : (
        <div className="max-w-2xl space-y-8 border-t border-line pt-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="mb-3 h-2 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
