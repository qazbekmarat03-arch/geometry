import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import {
  summarizeStudentLearning,
  type LearningActivity,
  type LearningCourse,
  type PublishedLesson,
} from "./learning-progress-model";

export async function getStudentLearningProgress(
  studentId: string,
  courses: LearningCourse[],
  grantedIds: string[],
) {
  await requireAdmin();
  if (!validId(studentId)) throw new Error("Invalid student");
  const db = await createClient();
  const activity: LearningActivity[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db
      .from("lesson_progress")
      .select(
        "lesson_id,completed,video_progress,updated_at,playback_saved_at,lessons!inner(title,modules!inner(course_id))",
      )
      .eq("user_id", studentId)
      .order("lesson_id")
      .range(offset, offset + 499);
    if (result.error)
      throw new Error("Student learning activity could not be loaded.");
    activity.push(...(result.data as unknown as LearningActivity[]));
    if (result.data.length < 500) break;
  }
  const courseIds = [
    ...new Set([
      ...grantedIds,
      ...activity.map((row) => row.lessons.modules.course_id),
    ]),
  ];
  const lessons: PublishedLesson[] = [];
  // Bound query URL size and page results so larger courses are counted fully.
  for (let index = 0; index < courseIds.length; index += 100) {
    for (let offset = 0; ; offset += 500) {
      const result = await db
        .from("lessons")
        .select("id,modules!inner(course_id)")
        .in("modules.course_id", courseIds.slice(index, index + 100))
        .eq("is_published", true)
        .order("id")
        .range(offset, offset + 499);
      if (result.error) throw new Error("Course progress could not be loaded.");
      lessons.push(...(result.data as unknown as PublishedLesson[]));
      if (result.data.length < 500) break;
    }
  }
  return summarizeStudentLearning(courses, grantedIds, lessons, activity);
}
