import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Теория жинағы" };
export default async function Page() {
  await requireUser();
  const db = await createClient();
  const { data, error } = await db
    .from("theory_topics")
    .select("id,title,course_id,courses(title)")
    .eq("is_published", true)
    .order("position")
    .order("id");
  if (error) throw new Error("Теория жүктелмеді.");
  return (
    <>
      <p className="eyebrow text-brand">ОҚЫ. ТҮСІН. ҚАЙТАЛА.</p>
      <h1 className="my-4">Теория жинағы</h1>
      <p className="mb-8 text-muted">
        Тақырыпты таңдап, анықтамалар мен формулаларды өз қарқыныңмен қайтала.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((t) => (
          <Link
            key={t.id}
            href={"/dashboard/theory/" + t.id}
            className="premium-card p-6"
          >
            <p className="text-sm text-muted">
              {(t.courses as unknown as { title: string })?.title}
            </p>
            <h2 className="my-4 text-xl">{t.title}</h2>
            <span className="text-brand">Оқуды бастау →</span>
          </Link>
        ))}
      </div>
      {!data?.length && (
        <p className="empty-installation">
          Қолжетімді курстарыңыздың теориялары әзірге жарияланбаған.
        </p>
      )}
    </>
  );
}
