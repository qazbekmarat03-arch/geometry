import { type Dashboard } from "@/lib/dashboard/model";
import { PageHeading } from "@/components/layout/page-heading";
import { ProgressBar } from "./progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
export function ProgressView({ data }: { data: Dashboard }) {
  return (
    <>
      <PageHeading
        label="ОҚУ ЖОЛЫ / 03"
        title="Әр қадам — нәтиже."
        description="Кішкентай қадамдардан үлкен түсінік қалыптасады. Өз ілгерілеуіңді бақыла."
      />
      <section className="progress-landscape">
        <div>
          <p className="eyebrow mb-5 text-muted">ЖАЛПЫ ПРОГРЕСС</p>
          <p className="progress-number">
            {data.percent}
            <span className="text-4xl">%</span>
          </p>
        </div>
        <div className="self-center">
          <p className="mb-5 text-sm text-muted">
            {data.completed} / {data.total} сабақ аяқталды
          </p>
          <ProgressBar value={data.percent} label="Жалпы оқу прогресі" />
          <dl className="mt-8 flex gap-10">
            {[
              { label: "Курстар", value: data.courses.length },
              { label: "Аяқталған", value: data.completed },
              { label: "Қалған", value: data.total - data.completed },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] text-muted">{item.label}</dt>
                <dd className="mt-2 font-display text-3xl tracking-tight">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      {!data.courses.length ? (
        <EmptyState
          title="Сізге әзірге курс ашылмаған."
          description="Курс қолжетімді болғанда оқу прогресі осы жерде көрсетіледі."
        />
      ) : (
        <section>
          {data.courses.map((course, i) => (
            <article className="progress-course" key={course.id}>
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <p className="eyebrow mb-3 text-muted">
                    КУРС {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="text-3xl">{course.title}</h2>
                  <p className="mt-3 text-xs text-muted">
                    {course.completed} / {course.total} сабақ аяқталды ·{" "}
                    {course.remaining} сабақ қалды
                  </p>
                </div>
                <span className="font-display text-4xl tracking-tight">
                  {course.percent}
                  <small className="text-lg">%</small>
                </span>
              </div>
              <ProgressBar
                value={course.percent}
                label={course.title + ": курс прогресі"}
              />
              <ul className="module-progress-list mt-10">
                {course.moduleProgress.map((module, j) => (
                  <li key={module.id}>
                    <div className="mb-3 flex justify-between gap-4 text-sm">
                      <span>
                        <span className="mr-3 text-xs text-muted">
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        {module.title}
                      </span>
                      <span className="text-xs text-muted">
                        {module.completed}/{module.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={module.percent}
                      label={module.title + ": прогресс"}
                    />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
