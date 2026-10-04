import { redirect } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSessionAccess } from "@/lib/auth/session";
import { accessDestination } from "@/lib/auth/access";
import { switchAccount } from "@/app/auth/actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Курсқа рұқсат",
  robots: { index: false, follow: false },
};

export default async function AccessDeniedPage() {
  const access = await getSessionAccess();
  if (access.status !== "denied") redirect(accessDestination(access));
  return (
    <AuthShell>
      <span className="mb-6 inline-flex rounded-2xl bg-brand-light p-3 text-brand">
        <ShieldCheck size={26} aria-hidden="true" />
      </span>
      <h1 className="text-4xl font-medium leading-tight tracking-[-.05em]">
        Қолжетімділік жоқ
      </h1>
      <p className="mt-3 text-sm font-medium">
        Бұл аккаунтқа курсқа рұқсат берілмеген.
      </p>
      <p className="mt-4 text-sm leading-7 text-muted">
        Курсқа тіркелген Google аккаунтыңмен кіріп көр. Рұқсат алу немесе оны
        қалпына келтіру үшін курс әкімшісіне хабарлас.
      </p>
      <div className="my-6 rounded-xl border border-line bg-surface p-4">
        <p className="mb-2 text-xs text-muted">Кірген аккаунтың</p>
        <p className="flex items-start gap-2 text-sm font-medium">
          <Mail
            size={17}
            className="mt-0.5 shrink-0 text-brand"
            aria-hidden="true"
          />
          <span className="break-all">
            {access.user.email || "Email анықталмады"}
          </span>
        </p>
      </div>
      <form action={switchAccount}>
        <SubmitButton className="w-full">Басқа аккаунтпен кіру</SubmitButton>
      </form>
    </AuthShell>
  );
}
