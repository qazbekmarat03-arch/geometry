import { PageHeading } from "@/components/layout/page-heading";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDashboardData } from "@/lib/db/dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/dashboard/course-card";
import {
  ContinueLearning,
  OverallProgress,
  RecentLessons,
} from "@/components/dashboard/overview";
export const metadata = { title: "Жеке кабинет" };
export default async function DashboardPage() {
  const data = await getDashboardData();
  const name = data.profile.full_name?.trim().split(/\s+/)[0] || "оқушы";
  return (
    <>
      <PageHeading
        label="МЕНІҢ ОҚУ КЕҢІСТІГІМ / 01"
        title={
          <>
            Қайта оралғаныңа қуаныштымыз,{" "}
            <span className="text-brand">{name}.</span>
          </>
        }
        description="Бүгін де бір қадам алға. Оқуыңды тоқтаған жеріңнен жалғастыр."
      />
      {!data.courses.length ? (
        <EmptyState
          title="Сізге әзірге курс ашылмаған."
          description="Курс қолжетімді болғанда, ол осы жерде пайда болады. Қосымша ақпарат алу үшін курс әкімшісіне хабарлас."
        />
      ) : (
        <div>
          <div className="dashboard-stage">
            <ContinueLearning data={data} />
            <OverallProgress data={data} />
          </div>
          <div className="min-w-0 space-y-9">
            <section aria-labelledby="my-courses-title">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="my-courses-title" className="text-lg font-semibold">
                  Менің курстарым{" "}
                  <span className="ml-1 text-sm font-normal text-muted">
                    ({data.courses.length})
                  </span>
                </h2>
                <Link
                  href="/dashboard/courses"
                  className="flex items-center gap-1 text-xs font-medium text-brand"
                >
                  Барлық курстар <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="course-gallery">
                {data.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          </div>
          <aside aria-label="Оқу нәтижелері" className="activity-journal">
            <RecentLessons data={data} />
          </aside>
        </div>
      )}
    </>
  );
}
