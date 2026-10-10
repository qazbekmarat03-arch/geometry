import { LessonQuiz } from "./lesson-quiz";
import type { QuizView } from "@/lib/quiz/import";
import { CurriculumPanel } from "./curriculum-panel";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  Circle,
  LockKeyhole,
  Clock3,
  AlignLeft,
} from "lucide-react";
import { type CourseSummary, lessonHref } from "@/lib/dashboard/model";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { LessonPlayer } from "./lesson-player";
import { HomeworkCard } from "./homework-card";
import { PageHeading } from "@/components/layout/page-heading";
type Selected = CourseSummary["lessons"][number];
export function CourseWorkspace({
  course,
  selected,
  homework,
  quiz,
}: {
  quiz: QuizView | null;
  course: CourseSummary;
  selected?: Selected;
  homework: {
    fileName: string | null;
    uploadedAt: string | null;
    available: boolean;
  } | null;
}) {
  const index = course.lessons.findIndex(
      (lesson) => lesson.id === selected?.id,
    ),
    previous = course.lessons[index - 1],
    next = course.lessons[index + 1];
  const duration = (seconds: number) =>
    seconds > 0 ? Math.ceil(seconds / 60) + " мин" : "—";
  return (
    <>
      <Link
        href="/dashboard/courses"
        className="mb-7 inline-flex gap-2 text-xs text-muted"
      >
        <ArrowLeft size={14} />
        Менің курстарым
      </Link>
      <div className="course-overview">
        <PageHeading
          label="КУРС / GEOMETRY"
          title={course.title}
          description={course.description || undefined}
        />
        <section className="self-end pb-10">
          <div className="mb-4 flex items-end justify-between">
            <span className="text-xs text-muted">
              {course.completed} / {course.total} сабақ аяқталды
            </span>
            <span className="font-display text-4xl tracking-[-.05em]">
              {course.percent}
              <small className="text-sm">%</small>
            </span>
          </div>
          <ProgressBar value={course.percent} label="Курс прогресі" />
          <p className="mt-4 text-[10px] text-muted">
            {course.modules.length} модуль · {course.total} сабақ ·{" "}
            {course.lesson_unlock_mode === "sequential"
              ? "Кезекпен оқу"
              : "Өз қарқыныңмен оқу"}
          </p>
        </section>
      </div>
      <div className="lesson-layout">
        <CurriculumPanel count={course.total}>
          <nav aria-label="Курс сабақтары">
            <p className="eyebrow mb-6 text-muted">ОҚУ БАҒДАРЛАМАСЫ</p>
            {[...course.modules]
              .sort((a, b) => a.position - b.position)
              .map((module, i) => {
                const lessons = course.lessons.filter(
                  (lesson) => lesson.moduleId === module.id,
                );
                return (
                  <details
                    className="curriculum-module"
                    key={module.id}
                    open={selected?.moduleId === module.id || i === 0}
                  >
                    <summary>
                      <span className="module-order">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        {module.title}
                        <small className="mt-2 block font-sans text-[10px] font-normal text-muted">
                          {lessons.length} сабақ
                        </small>
                      </span>
                    </summary>
                    <ol className="mt-3">
                      {lessons.map((lesson, j) => {
                        const state = lesson.locked ? (
                          <LockKeyhole size={13} />
                        ) : lesson.progress?.completed ? (
                          <Check size={13} />
                        ) : selected?.id === lesson.id ? (
                          <Play size={13} />
                        ) : (
                          <Circle size={12} />
                        );
                        const content = (
                          <>
                            <span className="mt-1 shrink-0">{state}</span>
                            <span>
                              <span className="block">
                                {i + 1}.{j + 1} &nbsp;{lesson.title}
                              </span>
                              <small className="mt-1 block text-[10px] text-muted">
                                {lesson.locked
                                  ? "Алдыңғы сабақты аяқтаңыз"
                                  : duration(lesson.duration)}
                              </small>
                              <span className="sr-only">
                                {lesson.progress?.completed ? "Аяқталған" : ""}
                              </span>
                            </span>
                          </>
                        );
                        return (
                          <li key={lesson.id}>
                            {lesson.locked ? (
                              <div className="lesson-row" aria-disabled="true">
                                {content}
                              </div>
                            ) : (
                              <Link
                                className="lesson-row"
                                href={lessonHref(course.id, lesson.id)}
                                aria-current={
                                  selected?.id === lesson.id
                                    ? "page"
                                    : undefined
                                }
                              >
                                {content}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                    {!lessons.length && (
                      <p className="mt-4 text-xs leading-6 text-muted">
                        Бұл бөлімге сабақтар әлі қосылмаған.
                      </p>
                    )}
                  </details>
                );
              })}
          </nav>
        </CurriculumPanel>
        {selected && homework ? (
          <article className="min-w-0">
            <p className="eyebrow mb-4 text-brand">
              САБАҚ {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mb-4 text-3xl leading-tight sm:text-4xl">
              {selected.title}
            </h2>
            <p className="mb-8 flex items-center gap-2 text-xs text-muted">
              <Clock3 size={13} />
              {duration(selected.duration)}
              <span className="mx-1">·</span>
              {selected.moduleTitle}
            </p>
            <LessonPlayer
              key={selected.id}
              courseId={course.id}
              lessonId={selected.id}
              position={selected.progress?.video_progress ?? 0}
              quizRequired={!!quiz && quiz.mode !== "pdf" && !quiz.passed}
              completed={!!selected.progress?.completed && (!quiz || quiz.passed)}
            />
            <nav
              aria-label="Сабақтар арасында өту"
              className="mb-8 mt-5 flex flex-wrap justify-between gap-3 border-t border-line pt-5"
            >
              {previous ? (
                <ButtonLink
                  href={lessonHref(course.id, previous.id)}
                  variant="ghost"
                >
                  <ArrowLeft size={14} />
                  Алдыңғы
                </ButtonLink>
              ) : (
                <Button disabled variant="ghost">
                  <ArrowLeft size={14} />
                  Алдыңғы
                </Button>
              )}
              {next?.locked ? (
                <Button disabled variant="ghost">
                  <LockKeyhole size={14} />
                  Алдыңғы сабақты аяқтаңыз
                </Button>
              ) : next ? (
                <ButtonLink
                  href={lessonHref(course.id, next.id)}
                  variant="ghost"
                >
                  Келесі сабақ
                  <ArrowRight size={14} />
                </ButtonLink>
              ) : (
                <ButtonLink href="/dashboard/progress" variant="ghost">
                  Прогресті көру
                  <Check size={14} />
                </ButtonLink>
              )}
            </nav>
            <div className="lesson-paper">
              <AlignLeft size={18} className="mt-1 text-muted" />
              <div>
                <h3 className="mb-3 text-lg">Сабақ туралы</h3>
                <p className="whitespace-pre-line text-sm leading-7 text-muted">
                  {selected.description ||
                    "Бұл сабаққа сипаттама әлі қосылмаған."}
                </p>
              </div>
            </div>
            {quiz?.mode !== "quiz" && <HomeworkCard lessonId={selected.id} {...homework} />}
            {quiz && quiz.mode !== "pdf" && <LessonQuiz key={`${selected.id}-${quiz.version}`} lessonId={selected.id} initial={quiz} />}
          </article>
        ) : (
          <EmptyState
            title="Сабақтар әзірге жабық"
            description="Сабақтар жарияланған кезде осы жерден оқуды бастай аласың."
          />
        )}
      </div>
    </>
  );
}
