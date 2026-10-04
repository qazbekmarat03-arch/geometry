"use server";
import { revalidatePath } from "next/cache";
import { getAuthorizedLesson } from "@/lib/db/lesson";
import { validId } from "@/lib/course/media";

export async function saveLessonProgress(
  courseId: string,
  lessonId: string,
  seconds: number | null,
  complete = false,
): Promise<{ ok: boolean }> {
  if (
    !validId(courseId) ||
    !validId(lessonId) ||
    typeof complete !== "boolean" ||
    (seconds !== null &&
      (!Number.isInteger(seconds) || seconds < 0 || seconds > 2147483646))
  )
    return { ok: false };
  // Both the server and the database RPC verify grant + actual lesson/course membership.
  const { supabase } = await getAuthorizedLesson(courseId, lessonId);
  const { error } = await supabase.rpc("save_lesson_progress", {
    target_course: courseId,
    target_lesson: lessonId,
    playback_seconds: seconds,
    mark_completed: complete,
  });
  if (error) return { ok: false };
  if (complete) revalidatePath("/dashboard", "layout");
  else revalidatePath("/dashboard");
  return { ok: true };
}
