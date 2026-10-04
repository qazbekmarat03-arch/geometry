import { PageSkeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main id="main" className="mx-auto max-w-lg px-5 py-20">
      <PageSkeleton kind="form" />
    </main>
  );
}
