import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import {
  courseAccessLabel,
  studentSelection,
  type StudentDetails,
} from "@/lib/admin/students";
import { StudentControl } from "@/components/admin/student-controls";
import { CourseAccessControls } from "@/components/admin/course-access-controls";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getStudentLearningProgress } from "@/lib/admin/learning-progress";
import { StudentLearningProgress } from "@/components/admin/student-learning-progress";

export const metadata = { title: "Оқушы туралы" };
export default async function StudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireAdmin();
  const { studentId } = await params;
  if (!validId(studentId)) notFound();
  const db = await createClient();
  const { data, error } = await db
    .from("profiles")
    .select(studentSelection)
    .eq("id", studentId)
    .eq("role", "student")
    .maybeSingle();
  if (error) throw new Error("Student could not be loaded.");
  if (!data) notFound();
  const student = data as unknown as StudentDetails;
  const courses: { id: string; title: string; is_published: boolean }[] = [];
  // Fetch every course, including drafts, beyond the API's default row limit.
  for (let offset = 0; ; offset += 500) {
    const result = await db
      .from("courses")
      .select("id,title,is_published")
      .order("title")
      .order("id")
      .range(offset, offset + 499);
    if (result.error) throw new Error("Courses could not be loaded.");
    courses.push(...result.data);
    if (result.data.length < 500) break;
  }
  const now = new Date().getTime();
  const learningProgress = await getStudentLearningProgress(
    studentId,
    courses,
    student.course_access.map((access) => access.course_id),
  );
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("kk-KZ", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Almaty",
    }).format(new Date(date));
  return (
    <>
      <ButtonLink href="/admin/students" variant="ghost" className="mb-6">
        ← Оқушылар
      </ButtonLink>
      <Card className="student-identity-panel mb-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold tracking-tight">
              {student.full_name || "Оқушы"}
            </h1>
            <p className="mt-3 break-all text-muted">
              {student.email || "Email көрсетілмеген"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Тіркелген күні: {formatDate(student.created_at)}
            </p>
          </div>
          <Badge className={student.is_active ? "" : "bg-surface text-muted"}>
            {student.is_active ? "Белсенді" : "Өшірілген"}
          </Badge>
        </div>
        <div className="mt-6">
          <StudentControl
            key={String(student.is_active)}
            operation={student.is_active ? "deactivate" : "activate"}
            studentId={student.id}
            label={
              student.is_active
                ? "Платформаға кіруді тоқтату"
                : "Оқушыны белсендіру"
            }
            description={
              student.is_active
                ? "Оқушының платформаға және жаңа материалдарға қолжетімділігі дереу тоқтатылады. Қайта белсендіргенде бұрынғы курс рұқсаттары сақталады."
                : "Оқушының аккаунтын қайта белсендіруді растайсыз ба?"
            }
          />
        </div>
      </Card>
      <StudentLearningProgress courses={learningProgress} />
      <h2 className="mb-3 text-xl font-semibold">Курсқа қолжетімділік</h2>
      <p className="mb-5 text-sm text-muted">
        Мерзім аяқталған сәтте курс автоматты түрде жабылады. Уақыт Алматы
        бойынша көрсетілген.
      </p>
      {!student.is_active && (
        <p className="mb-5 rounded-xl bg-brand-light p-4 text-sm text-brand">
          Аккаунт белсенді емес. Курсқа рұқсат беру аккаунтты автоматты түрде
          белсендірмейді.
        </p>
      )}
      {!courses.length ? (
        <EmptyState
          title="Курстар әзірге жоқ"
          description="Қосылған курстар осы жерде көрсетіледі."
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const access = student.course_access.find(
              (item) => item.course_id === course.id,
            );
            return (
              <Card
                key={course.id}
                className="access-row flex flex-wrap items-center justify-between gap-5"
              >
                <div>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {access
                      ? courseAccessLabel(access, student.is_active, now)
                      : "Рұқсат берілмеген"}
                    {access && (
                      <>
                        {" "}
                        ·{" "}
                        {access.expires_at
                          ? `Аяқталуы: ${formatDate(access.expires_at)}`
                          : "Мерзімсіз"}
                      </>
                    )}
                  </p>
                  {!course.is_published && (
                    <Badge className="mt-2 bg-surface text-muted">
                      Курс жарияланбаған
                    </Badge>
                  )}
                </div>
                <CourseAccessControls
                  studentId={student.id}
                  courseId={course.id}
                  title={course.title}
                  hasAccess={!!access}
                />
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
