import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { PRACTICE_WHATSAPP } from "@/lib/practice";
import { PracticeRunner } from "@/components/course/practice-runner";
export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const db = await createClient();
  const { data: e } = await db
    .from("practice_exams")
    .select("title,is_free")
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return (
      <>
        <h1 className="text-3xl">{e.title}</h1>
        <p className="my-6">
          Нұсқаны тапсыру үшін Google аккаунтыңызбен кіріңіз.
        </p>
        <Link className="text-brand underline" href="/login?next=practice">
          Google арқылы кіру →
        </Link>
      </>
    );
  const { data, error } = await db.rpc("get_practice", { target: id });
  if (error)
    return (
      <>
        <h1 className="text-3xl">Қолжетімділік жоқ</h1>
        <p className="my-6">
          Бұл нұсқаға рұқсат ашылмаған немесе аккаунт белсенді емес.
        </p>
        <a className="text-brand underline" href={PRACTICE_WHATSAPP}>
          WhatsApp арқылы хабарласу →
        </a>
      </>
    );
  return (
    <>
      <Link href="/practice">← Нұсқалар</Link>
      <h1 className="my-6 text-3xl">{e.title}</h1>
      {data ? (
        <PracticeRunner id={id} initial={data} />
      ) : (
        <p>Тапсырмалар әлі енгізілмеген.</p>
      )}
    </>
  );
}
