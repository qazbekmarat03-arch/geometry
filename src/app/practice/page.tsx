import Link from "next/link";
import { PracticeBadge } from "@/components/course/practice-badge";
import { createClient } from "@/lib/supabase/server";
import { PRACTICE_WHATSAPP } from "@/lib/practice";
export const metadata = { title: "Нұсқа талдау" };
export default async function PracticeCatalog() {
  const db = await createClient();
  const { data, error } = await db
    .from("practice_exams")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Нұсқаларды жүктеу мүмкін болмады.");
  return (
    <>
      <p className="text-sm text-brand">ҰБТ МАТЕМАТИКА</p>
      <h1 className="my-4 text-4xl">Нұсқа талдау</h1>
      <p className="mb-8 max-w-xl text-muted">
        Біліміңді сынап көр. Нұсқаны тапсырып, нәтижені және әр есептің толық
        шешу жолын қара. Бір ақылы нұсқа + талдауы — 500 ₸.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {data?.map((e) => (
          <article
            key={e.id}
            className={`practice-catalog-card rounded-3xl border border-line bg-surface p-6 ${e.is_free ? "practice-free" : ""}`}
          >
            <PracticeBadge title={e.title} free={e.is_free} />
            <h2 className="my-4 text-2xl">{e.title}</h2>
            <p className="mb-6 text-muted">{e.description}</p>
            <Link
              className="inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white"
              href={"/practice/" + e.id}
            >
              Нұсқаны ашу →
            </Link>
            {!e.is_free && (
              <a
                className="ml-4 inline-block py-3 text-brand underline"
                href={PRACTICE_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp арқылы алу
              </a>
            )}
          </article>
        ))}
      </div>
      {!data?.length && (
        <div className="rounded-3xl border border-line p-8">
          <h2 className="text-xl">Нұсқалар дайындалып жатыр</h2>
          <p className="mt-3 text-muted">
            Алғашқы нұсқа жарияланғанда осы жерден тапсыра аласыз.
          </p>
        </div>
      )}
    </>
  );
}
