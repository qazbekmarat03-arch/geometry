import { PageHeading } from "@/components/layout/page-heading";
import { getDashboardData } from "@/lib/db/dashboard";
import { CourseCard } from "@/components/dashboard/course-card";
import { EmptyState } from "@/components/ui/empty-state";
export const metadata = { title: "Менің курстарым" };
export default async function CoursesPage() {
  const data = await getDashboardData();
  return (
    <>
      <PageHeading
        label="БІЛІМ КІТАПХАНАСЫ / 02"
        title="Менің курстарым"
        description="Саған ашылған курстар. Әрқайсысы — түсінудің жаңа деңгейі."
      />
      {data.courses.length ? (
        <div className="course-gallery">
          {data.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Сізге әзірге курс ашылмаған."
          description="Курс қолжетімді болғанда, осы жерден оқуды бастай аласың."
        />
      )}
    </>
  );
}
