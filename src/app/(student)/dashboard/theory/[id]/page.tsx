import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { QuizText } from "@/components/course/quiz-text";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  if (!validId(id)) notFound();
  const { data, error } = await (
    await createClient()
  )
    .from("theory_topics")
    .select("title,source")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error("Теория жүктелмеді.");
  if (!data) notFound();
  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/dashboard/theory" className="text-sm text-brand">
        ← Теория жинағы
      </Link>
      <h1 className="my-7">{data.title}</h1>
      <div className="premium-card p-5 sm:p-9">
        <QuizText text={data.source} />
      </div>
    </article>
  );
}
