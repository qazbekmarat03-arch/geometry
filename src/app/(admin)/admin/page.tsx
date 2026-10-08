import { PageHeading } from "@/components/layout/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { CourseArtwork } from "@/components/course/course-artwork";
import Link from "next/link";
import { BookOpen, Play, UserCheck, Users, ArrowUpRight } from "lucide-react";
import { StudentsTable } from "@/components/admin/students-table";
import { getAdminOverview } from "@/lib/admin/queries";

export const metadata = { title: "Басқару панелі" };

export default async function AdminPage() {
  const overview = await getAdminOverview();
  const cards = [
    {
      title: "Барлық оқушылар",
      value: overview.students,
      icon: Users,
      href: "/admin/students",
    },
    {
      title: "Белсенді оқушылар",
      value: overview.activeStudents,
      icon: UserCheck,
      href: "/admin/students?active=true",
    },
    {
      title: "Курстар",
      value: overview.courses,
      icon: BookOpen,
      href: "/admin/courses",
    },
    {
      title: "Сабақтар",
      value: overview.lessons,
      icon: Play,
      href: "/admin/lessons",
    },
  ];
  return (
    <>
      <PageHeading
        label="БАСҚАРУ КЕҢІСТІГІ / 01"
        title={
          <>
            Білімге бағыт.
            <br />
            Әр қадамға мән.
          </>
        }
        description="Оқушылар мен оқу материалдары — бір кеңістікте."
        action={
          <ButtonLink href="/admin/courses">Курстарды басқару ↗</ButtonLink>
        }
      />
      <section aria-label="Жалпы мәлімет" className="admin-metrics">
        {cards.map(({ title, value, icon: Icon, href }) => (
          <Link prefetch={false} key={title} href={href} className="admin-metric group">
            <div className="h-full transition-colors group-hover:text-brand">
              <div className="mb-6 flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl text-muted">
                  <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <ArrowUpRight
                  size={17}
                  className="text-muted"
                  aria-hidden="true"
                />
              </div>
              {title === "Барлық оқушылар" && (
                <CourseArtwork className="metric-art" />
              )}
              <p className="admin-metric-number">
                {value.toLocaleString("kk-KZ")}
              </p>
              <h2 className="mt-2 text-sm text-muted">{title}</h2>
            </div>
          </Link>
        ))}
      </section>
      <section className="mt-10" aria-labelledby="recent-students">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="recent-students"
              className="text-xl font-semibold tracking-tight"
            >
              Жаңа оқушылар
            </h2>
            <p className="mt-1 text-sm text-muted">Соңғы тіркелген оқушылар.</p>
          </div>
          <Link prefetch={false}
            href="/admin/students"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            Барлығын көру <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <StudentsTable students={overview.recentStudents} />
      </section>
    </>
  );
}
