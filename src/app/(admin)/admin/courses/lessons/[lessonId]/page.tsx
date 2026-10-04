import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { ContentAction, ContentForm } from "@/components/admin/content-editor";
import { HomeworkUpload } from "@/components/admin/homework-upload";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
export const metadata = { title: "Сабақты өңдеу" };
export default async function LessonEditor({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  await requireAdmin();
  const { lessonId } = await params;
  if (!validId(lessonId)) notFound();
  const db = await createClient();
  const { data, error } = await db
    .from("lessons")
    .select(
      "id,title,description,video_url,duration,is_published,homework_file_name,homework_pdf_url,modules!inner(title,course_id)",
    )
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw new Error("Lesson could not be loaded");
  if (!data) notFound();
  const lesson = data as unknown as {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    duration: number;
    is_published: boolean;
    homework_file_name: string | null;
    homework_pdf_url: string | null;
    modules: { title: string; course_id: string };
  };
  return (
    <>
      <ButtonLink
        variant="ghost"
        href={`/admin/courses/${lesson.modules.course_id}`}
        className="mb-5"
      >
        ← Курс бағдарламасы
      </ButtonLink>
      <p className="mb-2 text-sm text-muted">{lesson.modules.title}</p>
      <h1 className="mb-7 text-3xl font-semibold">Сабақты өңдеу</h1>
      <div className="lesson-editor-grid">
        <Card className="!border-0 !bg-transparent !p-0 !shadow-none">
          <ContentForm kind="lesson" values={lesson} />
        </Card>
        <Card className="self-start !bg-[#ecefe4] !shadow-none">
          <h2 className="mb-5 text-xl font-semibold">Үй тапсырмасы</h2>
          {lesson.homework_pdf_url && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {lesson.homework_file_name || "PDF тапсырмасы"}
              </p>
              <ContentAction
                kind="lesson"
                id={lesson.id}
                operation="remove_homework"
                label="PDF тіркемесін жою"
                confirmation="Осы сабақтың PDF тіркемесін алып тастайсыз ба?"
              />
            </div>
          )}
          <HomeworkUpload
            lessons={[{ id: lesson.id, label: lesson.title }]}
            fixedLessonId={lesson.id}
          />
        </Card>
        <ContentAction
          kind="lesson"
          id={lesson.id}
          operation="delete"
          label="Сабақты жою"
          confirmation="Сабақ пен оған қатысты оқу прогресі біржола жойылады. Жалғастырасыз ба?"
        />
      </div>
    </>
  );
}
