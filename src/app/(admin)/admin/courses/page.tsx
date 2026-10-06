import { PageHeading } from "@/components/layout/page-heading";
import { CourseArtwork } from "@/components/course/course-artwork";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  ContentAction,
  ContentDialog,
} from "@/components/admin/content-editor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
export const metadata = { title: "Курстар" };
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const value = Number(query.page ?? 1);
  const page =
    Number.isSafeInteger(value) && value > 0 ? Math.min(value, 100000) : 1;
  const db = await createClient();
  const { data, error, count } = await db
    .from("courses")
    .select("id,title,description,is_published", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("Courses could not be loaded");
  return (
    <>
      <PageHeading
        label="ОҚУ МАТЕРИАЛДАРЫ / 03"
        title="Курстар кеңістігі."
        description="Идеядан — толық оқу бағдарламасына. Материалдарды құрастыр, ретте, жарияла."
        action={<ContentDialog label="+ Курс құру" kind="course" />}
      />
      {!data.length ? (
        <EmptyState
          title="Курстар әзірге жоқ"
          description="Алғашқы курсты қосып, оқу бағдарламасын құрастырыңыз."
        />
      ) : (
        <div className="course-gallery">
          {data.map((course) => (
            <Card key={course.id} className="course-tile !p-0">
              <div className="course-art relative overflow-hidden rounded-[20px] bg-[#123b2d] p-8">
                <CourseArtwork className="mx-auto h-48 w-full" />
                <span className="absolute bottom-5 left-6 text-[9px] tracking-[.2em] text-muted">
                  DURYSTAP / GEOMETRY
                </span>
              </div>
              <div className="course-tile-info">
                <Badge>{course.is_published ? "Жарияланған" : "Жоба"}</Badge>
                <h2 className="mt-4 text-xl font-semibold">{course.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                  {course.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <ButtonLink href={`/admin/courses/${course.id}`}>
                    Курсты өңдеу
                  </ButtonLink>
                  <ContentAction
                    kind="course"
                    id={course.id}
                    operation="publish"
                    published={!course.is_published}
                    label={
                      course.is_published ? "Жариялауды тоқтату" : "Жариялау"
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <nav aria-label="Курс беттері" className="mt-6 flex justify-end gap-3">
        {page > 1 && (
          <ButtonLink
            variant="secondary"
            href={`/admin/courses?page=${page - 1}`}
          >
            Алдыңғы
          </ButtonLink>
        )}
        {page * 20 < (count ?? 0) && (
          <ButtonLink
            variant="secondary"
            href={`/admin/courses?page=${page + 1}`}
          >
            Келесі
          </ButtonLink>
        )}
      </nav>
    </>
  );
}
