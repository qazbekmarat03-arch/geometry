import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { type CourseSummary, lessonHref } from "@/lib/dashboard/model";
import { CourseThumbnail } from "./course-thumbnail";
import { ProgressBar } from "./progress-bar";
export function CourseCard({ course }: { course: CourseSummary }) {
  const activity = course.lessons
    .map((lesson) => lesson.progress?.updated_at)
    .filter((date): date is string => !!date)
    .sort()
    .at(-1);
  return (
    <Card className="course-tile overflow-hidden !p-0">
      <CourseThumbnail url={course.thumbnail_url} title={course.title} />
      <div className="course-tile-info">
        <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted">
          ОНЛАЙН КУРС
        </p>
        <h3 className="mb-5 text-2xl font-medium tracking-tight">
          {course.title}
        </h3>
        <div className="mb-2 flex justify-between gap-3 text-xs">
          <span className="text-muted">
            {course.completed} / {course.total} сабақ аяқталды
          </span>
          <span className="font-semibold text-brand">{course.percent}%</span>
        </div>
        <ProgressBar
          value={course.percent}
          label={`${course.title}: прогресс`}
        />
        <div className="course-tile-footer">
          <p className="max-w-[45%] text-[10px] leading-5 text-muted">
            {activity ? (
              <>
                Соңғы белсенділік
                <br />
                {new Intl.DateTimeFormat("kk-KZ", {
                  dateStyle: "medium",
                  timeZone: "Asia/Almaty",
                }).format(new Date(activity))}
              </>
            ) : (
              "Алғашқы қадамыңнан баста"
            )}
          </p>
          {course.resume ? (
            <ButtonLink
              href={lessonHref(course.id, course.resume.id)}
              variant="secondary"
              className="text-brand"
            >
              Оқуды жалғастыру <ArrowUpRight size={16} />
            </ButtonLink>
          ) : (
            <Button disabled variant="secondary" className="text-brand">
              Сабақтар жақында қосылады
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
