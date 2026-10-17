import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { QuizEditor } from "@/components/admin/quiz-editor";
import { PracticeAccess } from "@/components/admin/practice-access";
import { SubmitButton } from "@/components/ui/submit-button";
import { savePracticeMetadata } from "../actions";
export default async function EditPractice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const db = await createClient();
  const [
    { data: e, error },
    { data: content, error: contentError },
    { data: access, error: accessError },
  ] = await Promise.all([
    db.from("practice_exams").select("*").eq("id", id).maybeSingle(),
    db
      .from("practice_content")
      .select("source")
      .eq("exam_id", id)
      .maybeSingle(),
    db.from("practice_access").select("profiles(email)").eq("exam_id", id),
  ]);
  if (error || contentError || accessError)
    throw new Error(
      "Қате орын алды. Нұсқа деректері толық жүктелмеді. Қайта көріңіз.",
    );
  if (!e) notFound();
  const emails = (access ?? []).flatMap((a) => {
    const p = a.profiles as unknown as { email: string } | null;
    return p ? [p.email] : [];
  });
  return (
    <>
      <Link href="/admin/practice">← Нұсқалар</Link>
      <h1 className="my-6 text-3xl">{e.title}</h1>
      <form
        action={savePracticeMetadata}
        className="mb-8 space-y-4 rounded-3xl border border-line p-6"
      >
        <input type="hidden" name="id" value={id} />
        <label className="block">
          Атауы
          <input
            name="title"
            defaultValue={e.title}
            required
            maxLength={160}
            className="premium-input mt-2 w-full"
          />
        </label>
        <label className="block">
          Сипаттама
          <textarea
            name="description"
            defaultValue={e.description}
            maxLength={3000}
            className="premium-input mt-2 w-full"
          />
        </label>
        <label className="flex gap-3">
          <input type="checkbox" name="is_free" defaultChecked={e.is_free} />
          Тегін нұсқа
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={e.is_published}
          />
          Жарияланған
        </label>
        <p className="text-sm text-muted">
          Алдымен төменде тапсырмаларды сақтап, содан кейін нұсқаны жариялаңыз.
          Ақылы нұсқа — 500 ₸.
        </p>
        <SubmitButton>Өзгерістерді сақтау</SubmitButton>
      </form>
      <QuizEditor
        practice
        lessonId={id}
        initialMode="quiz"
        initialSource={content?.source ?? ""}
      />
      <PracticeAccess id={id} emails={emails} />
    </>
  );
}
