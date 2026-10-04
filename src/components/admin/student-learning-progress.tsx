import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import type { summarizeStudentLearning } from "@/lib/admin/learning-progress-model";

function ActivityDate({ value }: { value: string | null }) {
  return value ? (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("kk-KZ", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Almaty",
      }).format(new Date(value))}
    </time>
  ) : (
    <>Әзірге жоқ</>
  );
}
export function StudentLearningProgress({
  courses,
}: {
  courses: ReturnType<typeof summarizeStudentLearning>;
}) {
  return (
    <section aria-labelledby="student-learning-title" className="mb-10">
      <h2 id="student-learning-title" className="mb-3 text-xl font-semibold">
        Оқу прогресі
      </h2>
      <p className="mb-5 text-sm leading-6 text-muted">
        Жарияланған сабақтар бойынша нәтиже. Соңғы белсенділік — видео орнын
        немесе сабақтың аяқталуын соңғы сақтау уақыты. Уақыт Алматы бойынша.
      </p>
      {!courses.length ? (
        <Card>
          <p className="text-sm text-muted">
            Курсқа рұқсат пен оқу белсенділігі әзірге жоқ.
          </p>
        </Card>
      ) : (
        <div className="divide-y divide-line">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="!rounded-none !border-0 !bg-transparent !px-0 !py-8 !shadow-none"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold">
                    {course.title}
                  </h3>
                  {!course.is_published && (
                    <Badge className="mt-2 bg-surface text-muted">
                      Курс жарияланбаған
                    </Badge>
                  )}
                </div>
                <span className="shrink-0 text-2xl font-semibold tabular-nums text-brand">
                  {course.percent}%
                </span>
              </div>
              <ProgressBar
                label={`${course.title}: оқушы прогресі`}
                value={course.percent}
              />
              <p className="mt-3 text-sm text-muted">
                {course.completed} / {course.total} сабақ аяқталды
              </p>
              {!course.total && (
                <p className="mt-2 text-xs text-muted">
                  Жарияланған сабақтар әзірге жоқ.
                </p>
              )}
              <dl className="mt-5 space-y-4 border-t border-line pt-5 text-sm">
                <div>
                  <dt className="text-xs text-muted">Соңғы белсенділік</dt>
                  <dd className="mt-1 font-medium">
                    <ActivityDate value={course.lastActivity} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Соңғы қаралған сабақ</dt>
                  <dd className="mt-1 break-words font-medium">
                    {course.lastWatched
                      ? `«${course.lastWatched.title}»`
                      : "Әзірге қаралған сабақ жоқ"}
                  </dd>
                  {course.lastWatched && (
                    <dd className="mt-1 text-xs text-muted">
                      <ActivityDate value={course.lastWatched.at} />
                    </dd>
                  )}
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
