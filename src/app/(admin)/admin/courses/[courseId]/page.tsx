import { CurriculumEditor } from "@/components/admin/curriculum-editor";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import {
  ContentAction,
  ContentDialog,
  ContentForm,
} from "@/components/admin/content-editor";
import { ButtonLink } from "@/components/ui/button";
export const metadata = { title: "Курсты өңдеу" };
export default async function CourseEditor({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireAdmin();
  const { courseId } = await params;
  if (!validId(courseId)) notFound();
  const db = await createClient();
  const { data: course, error } = await db
    .from("courses")
    .select(
      "id,title,description,is_published,lesson_unlock_mode,modules(id,title,description,position,lessons(id,title,position,is_published))",
    )
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw new Error("Course could not be loaded");
  if (!course) notFound();
  const modules = [...course.modules].sort((a, b) => a.position - b.position);
  return (
    <>
      <ButtonLink variant="ghost" href="/admin/courses" className="mb-5">
        ← Курстар
      </ButtonLink>
      <h1 className="mb-7 text-3xl font-semibold">{course.title}</h1>
      <details className="editor-settings">
        <summary>Курс туралы · баптаулар</summary>
        <ContentForm kind="course" values={course} />
        <div className="mt-5 border-t border-line pt-4">
          <ContentAction
            kind="course"
            id={course.id}
            operation="delete"
            label="Курсты жою"
            confirmation={`«${course.title}» курсын жоясыз ба? Барлық модульдері, сабақтары, оқушылардың осы курсқа рұқсаттары және оқу прогресі біржола жойылады.`}
          />
        </div>
      </details>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Оқу бағдарламасы</h2>
        <ContentDialog kind="module" parent={course.id} label="+ Модуль қосу" />
      </div>
      {!modules.length && (
        <p className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
          Алғашқы модульді қосыңыз.
        </p>
      )}
      <CurriculumEditor modules={modules} />
    </>
  );
}
