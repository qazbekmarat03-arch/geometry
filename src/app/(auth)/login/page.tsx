import { ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
import { getSessionAccess } from "@/lib/auth/session";
import { accessDestination } from "@/lib/auth/access";
export const dynamic = "force-dynamic";
export const metadata = { title: "Кіру" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const access = await getSessionAccess();
  if (access.status !== "signed-out") redirect(accessDestination(access));
  return (
    <AuthShell>
      <p className="mb-3 text-xs font-semibold tracking-widest text-brand">
        DURYSTAP-ПЕН БІРГЕ
      </p>
      <h1 className="text-4xl font-medium tracking-[-.05em]">Қош келдің!</h1>
      <p className="mb-8 mt-4 text-sm leading-6 text-muted">
        Жеке кабинетіңе кіріп, геометрия әлеміне алғашқы қадамыңды жаса.
      </p>
      {error && (
        <p role="alert" className="mb-5 text-sm text-red-700">
          Кіру аяқталмады. Қайта көріңіз.
        </p>
      )}
      <GoogleLoginButton configured={!!getSupabaseConfig()} />
      <div className="mt-7 flex items-center gap-2 border-t border-line pt-5 text-xs text-muted">
        <ShieldCheck size={17} className="text-brand" />
        Google аккаунтыңмен қауіпсіз кіру
      </div>
    </AuthShell>
  );
}
