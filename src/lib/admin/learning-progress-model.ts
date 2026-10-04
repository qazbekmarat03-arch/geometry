export type LearningCourse = {
  id: string;
  title: string;
  is_published: boolean;
};
export type LearningActivity = {
  lesson_id: string;
  completed: boolean;
  video_progress: number;
  updated_at: string;
  playback_saved_at: string;
  lessons: { title: string; modules: { course_id: string } };
};
export type PublishedLesson = { id: string; modules: { course_id: string } };

function timestamp(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
export function summarizeStudentLearning(
  courses: LearningCourse[],
  grantedIds: string[],
  lessons: PublishedLesson[],
  activity: LearningActivity[],
) {
  const relevant = new Set([
    ...grantedIds,
    ...activity.map((row) => row.lessons.modules.course_id),
  ]);
  const byLesson = new Map(activity.map((row) => [row.lesson_id, row]));
  return courses
    .filter((course) => relevant.has(course.id))
    .map((course) => {
      const published = lessons.filter(
        (lesson) => lesson.modules.course_id === course.id,
      );
      const completed = published.filter(
        (lesson) => byLesson.get(lesson.id)?.completed,
      ).length;
      const rows = activity.filter(
        (row) => row.lessons.modules.course_id === course.id,
      );
      const lastActivity = rows
        .filter(
          (row) =>
            row.completed ||
            row.video_progress > 0 ||
            timestamp(row.playback_saved_at) !== null,
        )
        .map((row) => timestamp(row.updated_at))
        .filter((time): time is number => time !== null)
        .sort((a, b) => b - a)[0];
      // Completion can change updated_at without a new viewing. Prefer the
      // existing playback timestamp; old pre-migration records have -infinity.
      const watched = rows
        .map((row) => ({
          row,
          time:
            timestamp(row.playback_saved_at) ??
            (row.video_progress > 0 ? timestamp(row.updated_at) : null),
        }))
        .filter(
          (item): item is { row: LearningActivity; time: number } =>
            item.time !== null,
        )
        .sort((a, b) => b.time - a.time)[0];
      return {
        ...course,
        total: published.length,
        completed,
        percent: published.length
          ? Math.round((completed / published.length) * 100)
          : 0,
        lastActivity:
          lastActivity === undefined
            ? null
            : new Date(lastActivity).toISOString(),
        lastWatched: watched
          ? {
              title: watched.row.lessons.title,
              at: new Date(watched.time).toISOString(),
            }
          : null,
      };
    });
}
