import Link from "next/link";
import { PracticeBadge } from "@/components/course/practice-badge";
import { createClient } from "@/lib/supabase/server";
import { savePracticeMetadata } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
export default async function PracticeAdmin() {
  const { data, error } = await (
    await createClient()
  )
    .from("practice_exams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Нұсқаларды жүктеу мүмкін болмады.");
  return (
    <>
      <h1 className="text-3xl">Нұсқа талдау</h1>
      <p className="my-4 text-muted">
        Тегін және ақылы нұсқаларды, тапсырмалар мен оқушылардың қолжетімділігін
        басқарыңыз.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((e) => (
          <Link
            key={e.id}
            href={"/admin/practice/" + e.id}
            className={`practice-catalog-card rounded-3xl border border-line p-6 ${e.is_free ? "practice-free" : ""}`}
          >
            <PracticeBadge title={e.title} free={e.is_free} />
            <h2 className="mt-4 text-xl">{e.title}</h2>
            <p className="mt-3 text-muted">
              {e.is_published ? "Жарияланған" : "Жоба"}
            </p>
          </Link>
        ))}
      </div>
      {!data?.length && (
        <p className="my-6">Әзірге нұсқа жоқ. Алғашқы нұсқаны қосыңыз.</p>
      )}
      <form
        action={savePracticeMetadata}
        className="mt-8 max-w-xl space-y-4 rounded-3xl border border-line p-6"
      >
        <h2 className="text-xl">+ Нұсқа қосу</h2>
        <label className="block">
          Нұсқа атауы
          <input
            name="title"
            required
            maxLength={160}
            className="premium-input mt-2 w-full"
          />
        </label>
        <label className="block">
          Сипаттама
          <textarea
            name="description"
            maxLength={3000}
            className="premium-input mt-2 w-full"
          />
        </label>
        <label className="flex gap-3">
          <input name="is_free" type="checkbox" />
          Тегін нұсқа (белгіленбесе — 500 ₸)
        </label>
        <SubmitButton>Нұсқа жасау</SubmitButton>
      </form>
    </>
  );
}
