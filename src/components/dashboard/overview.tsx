import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { type Dashboard, lessonHref } from "@/lib/dashboard/model";
import { ProgressBar } from "./progress-bar";
import { CourseArtwork } from "@/components/course/course-artwork";
export function OverallProgress({ data }: { data: Dashboard }) {
  return (
    <section className="progress-aside">
      <p className="eyebrow text-muted">Жалпы прогресс</p>
      <div className="mb-5 mt-6 flex items-end gap-2">
        <span className="progress-number">
          {data.percent}
          <span className="text-2xl">%</span>
        </span>
        <span className="pb-1 text-xs text-muted">аяқталды</span>
      </div>
      <ProgressBar value={data.percent} label="Жалпы оқу прогресі" />
      <p className="mt-4 text-sm text-muted">
        {data.total
          ? `${data.completed} / ${data.total} сабақ аяқталды`
          : "Сабақтар қосылғанда прогресс осында көрінеді."}
      </p>
      <div className="mt-6 border-t border-line pt-4 text-xs leading-6 text-muted">
        {data.total && data.completed === data.total
          ? "Барлық қолжетімді сабақты аяқтадың. Жарайсың!"
          : "Әр аяқталған сабақ сені мақсатыңа жақындатады."}
      </div>
    </section>
  );
}
export function ContinueLearning({ data }: { data: Dashboard }) {
  const latest = data.latest;
  return (
    <section aria-labelledby="continue-title">
      <h2 id="continue-title" className="sr-only">
        Соңғы тоқтаған жерден жалғастыру
      </h2>
      <div className="continue-panel">
        <CourseArtwork className="learning-art text-lime" />
        <div className="relative">
          <p className="mb-5 text-[10px] tracking-[.16em] text-white/60">
            {latest ? "СОҢҒЫ ҚАРАЛҒАН САБАҚ" : "ЖАҢА БІЛІМГЕ АЛҒАШҚЫ ҚАДАМ"}
          </p>
          <h3 className="max-w-[75%] text-3xl font-medium leading-snug tracking-[-.045em] sm:text-4xl">
            {latest?.title ?? "Бүгінгі оқуыңды бастауға дайынсың ба?"}
          </h3>
          <p className="mb-6 mt-3 text-sm leading-6 text-white/65">
            {latest
              ? `${latest.courseTitle} · ${latest.moduleTitle}`
              : "Әлі сабақ қараған жоқсың. Төменнен курсыңды таңдап, бірінші сабақтан баста."}
          </p>
          {latest && (
            <p className="mb-7 text-[11px] text-white/60">
              {Math.ceil(latest.duration / 60)} мин ·{" "}
              {latest.progress?.video_progress
                ? "Тоқтаған жеріңнен жалғастыр"
                : "Өз қарқыныңмен оқы"}
            </p>
          )}
          {latest ? (
            <ButtonLink
              href={lessonHref(latest.courseId, latest.id)}
              variant="secondary"
              className="!border-lime !bg-lime"
            >
              <Play size={15} fill="currentColor" />
              Жалғастыру <ArrowRight size={16} />
            </ButtonLink>
          ) : (
            <ButtonLink
              href="/dashboard/courses"
              variant="secondary"
              className="!border-lime !bg-lime"
            >
              Курстарды көру <ArrowRight size={16} />
            </ButtonLink>
          )}
          {latest && (
            <div className="mt-7 max-w-xs border-t border-white/15 pt-4">
              <div className="mb-3 flex justify-between text-[11px] text-white/70">
                <span>Курс прогресі</span>
                <span>
                  {data.courses.find((course) => course.id === latest.courseId)
                    ?.percent ?? 0}
                  %
                </span>
              </div>
              <ProgressBar
                value={
                  data.courses.find((course) => course.id === latest.courseId)
                    ?.percent ?? 0
                }
                label="Курс прогресі"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
export function RecentLessons({ data }: { data: Dashboard }) {
  return (
    <section>
      <h2 className="mb-5 text-base font-semibold">
        Жақында аяқталған сабақтар
      </h2>
      {data.recent.length ? (
        <ul className="divide-y divide-line">
          {data.recent.map((lesson) => (
            <li key={lesson.id}>
              <Link prefetch={false}
                href={lessonHref(lesson.courseId, lesson.id)}
                className="flex items-start gap-3 rounded-lg py-4 transition-colors hover:bg-surface"
              >
                <span className="mt-0.5 rounded-full bg-brand-light p-1.5 text-brand">
                  <Check size={14} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium leading-5">
                    {lesson.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {lesson.courseTitle}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-7 text-muted">
          Әзірге аяқталған сабақ жоқ. Алғашқы сабақты аяқтаған соң, ол осы жерде
          көрінеді.
        </p>
      )}
    </section>
  );
}
