import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-16">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <p className="mb-4 text-center text-5xl font-semibold tracking-tight text-brand">
        404
      </p>
      <EmptyState
        title="Бет табылмады"
        description="Бұл бет жоқ немесе оның мекенжайы өзгерген."
        action={<ButtonLink href="/">Басты бетке оралу</ButtonLink>}
      />
    </main>
  );
}
