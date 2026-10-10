import type { QuizView } from "@/lib/quiz/import";
import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/db/dashboard";
import { getAuthorizedLesson } from "@/lib/db/lesson";
import { validId } from "@/lib/course/media";
import { homeworkReference } from "@/lib/homework/files";
import { CourseWorkspace } from "@/components/course/course-workspace";
export const metadata = { title: "Курс сабақтары" };
export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: lessonId } = await searchParams;
  if (!validId(courseId) || (lessonId !== undefined && !validId(lessonId)))
    notFound();
  const data = await getDashboardData(courseId);
  const course = data.courses.find((course) => course.id === courseId);
  if (!course) notFound();
  const selected = lessonId
    ? course.lessons.find((lesson) => lesson.id === lessonId)
    : course.resume;
  if (lessonId && !selected) notFound();
  const authorized = selected
    ? await getAuthorizedLesson(courseId, selected.id)
    : null;
  const quiz = authorized && selected ? await authorized.supabase.rpc("get_lesson_quiz", {target_lesson:selected.id}) : null;
  if(quiz?.error) throw new Error("Тестті жүктеу мүмкін болмады.");
  return (
    <CourseWorkspace
      quiz={quiz?.data as QuizView | null}
      course={course}
      selected={selected}
      homework={
        authorized
          ? {
              fileName: authorized.lesson.homework_file_name,
              uploadedAt: authorized.lesson.homework_uploaded_at,
              available: !!homeworkReference(
                authorized.lesson.homework_pdf_url,
              ),
            }
          : null
      }
    />
  );
}
