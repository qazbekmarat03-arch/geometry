export type Lesson = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  position: number;
  is_published: boolean;
  is_locked?: boolean;
  progress?: Progress | null;
};
export type CourseModule = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};
export type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  lesson_unlock_mode?: "all" | "sequential";
  modules: CourseModule[];
};
export type Progress = {
  lesson_id: string;
  completed: boolean;
  video_progress: number;
  updated_at: string;
};

export function buildDashboard(courses: Course[], progress: Progress[]) {
  const byLesson = new Map(progress.map((row) => [row.lesson_id, row]));
  const summaries = courses.map((course) => {
    const lessons = [...course.modules]
      .sort((a, b) => a.position - b.position)
      .flatMap((module) =>
        [...module.lessons]
          .filter((lesson) => lesson.is_published)
          .sort((a, b) => a.position - b.position)
          .map((lesson) => ({
            ...lesson,
            moduleId: module.id,
            moduleTitle: module.title,
            progress: lesson.progress ?? byLesson.get(lesson.id),
            locked: lesson.is_locked ?? false,
          })),
      );
    const completed = lessons.filter(
      (lesson) => lesson.progress?.completed,
    ).length;
    const moduleProgress = [...course.modules]
      .sort((a, b) => a.position - b.position)
      .map((module) => {
        const published = lessons.filter(
          (lesson) => lesson.moduleId === module.id,
        );
        const done = published.filter(
          (lesson) => lesson.progress?.completed,
        ).length;
        return {
          id: module.id,
          title: module.title,
          total: published.length,
          completed: done,
          remaining: published.length - done,
          percent: published.length
            ? Math.round((done / published.length) * 100)
            : 0,
        };
      });
    const watched = lessons
      .filter(
        (lesson) =>
          !lesson.locked && (lesson.progress?.video_progress ?? 0) > 0,
      )
      .sort(
        (a, b) =>
          Date.parse(b.progress!.updated_at) -
          Date.parse(a.progress!.updated_at),
      );
    const resume =
      watched.find((lesson) => !lesson.progress?.completed) ??
      lessons.find((lesson) => !lesson.locked && !lesson.progress?.completed) ??
      lessons.find((lesson) => !lesson.locked);
    return {
      ...course,
      lessons,
      completed,
      remaining: lessons.length - completed,
      moduleProgress,
      total: lessons.length,
      percent: lessons.length
        ? Math.round((completed / lessons.length) * 100)
        : 0,
      resume,
    };
  });
  const allLessons = summaries.flatMap((course) =>
    course.lessons.map((lesson) => ({
      ...lesson,
      courseId: course.id,
      courseTitle: course.title,
    })),
  );
  const latest = allLessons
    .filter(
      (lesson) =>
        !lesson.locked &&
        ((lesson.progress?.video_progress ?? 0) > 0 ||
          lesson.progress?.completed),
    )
    .sort(
      (a, b) =>
        Date.parse(b.progress!.updated_at) - Date.parse(a.progress!.updated_at),
    )[0];
  const recent = allLessons
    .filter((lesson) => !lesson.locked && lesson.progress?.completed)
    .sort(
      (a, b) =>
        Date.parse(b.progress!.updated_at) - Date.parse(a.progress!.updated_at),
    )
    .slice(0, 5);
  const completed = allLessons.filter(
    (lesson) => lesson.progress?.completed,
  ).length;
  return {
    courses: summaries,
    latest,
    recent,
    completed,
    total: allLessons.length,
    percent: allLessons.length
      ? Math.round((completed / allLessons.length) * 100)
      : 0,
  };
}
export type Dashboard = ReturnType<typeof buildDashboard>;
export type CourseSummary = Dashboard["courses"][number];
export function lessonHref(courseId: string, lessonId?: string) {
  return `/dashboard/courses/${courseId}${lessonId ? `?lesson=${lessonId}` : ""}`;
}
