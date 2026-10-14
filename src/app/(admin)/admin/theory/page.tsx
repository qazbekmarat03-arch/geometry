import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Теория жинағы" };
export default async function Page() {
  await requireAdmin();
  const db = await createClient();
  const { data, error } = await db
    .from("theory_topics")
    .select("id,title,is_published,position")
    .order("position")
    .order("id");
  if (error)
    throw new Error("Теория жүктелмеді. Дерекқор миграциясын тексеріңіз.");
  return (
    <>
      <div className="interior-heading">
        <div>
          <p className="eyebrow text-brand">ОҚУ МАТЕРИАЛДАРЫ</p>
          <h1>Теория жинағы</h1>
        </div>
        <Link
          className="premium-button button-primary px-5 py-3"
          href="/admin/theory/new"
        >
          + Тақырып қосу
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((t) => (
          <Link
            key={t.id}
            href={"/admin/theory/" + t.id}
            className="premium-card p-6"
          >
            <p className="text-sm text-muted">
              {t.is_published ? "Жарияланған" : "Жоба"}
            </p>
            <h2 className="mt-3 text-xl">{t.title}</h2>
            <p className="mt-5 text-brand">Өңдеу →</p>
          </Link>
        ))}
      </div>
      {!data?.length && (
        <p className="empty-installation">Алғашқы теория тақырыбын қосыңыз.</p>
      )}
    </>
  );
}
