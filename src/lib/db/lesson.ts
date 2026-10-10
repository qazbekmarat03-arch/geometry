import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";

export async function getAuthorizedLesson(courseId: string, lessonId: string) {
  if (!validId(courseId) || !validId(lessonId)) notFound();
  const user = await requireUser();
  const supabase = await createClient();
  const [grant, unlocked, result] = await Promise.all([
    supabase
      .from("course_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle(),
    supabase.rpc("can_access_lesson", { target_lesson: lessonId }),
    supabase
      .from("lessons")
      .select(
        "id, title, description, duration, homework_pdf_url, homework_file_name, homework_uploaded_at, modules!inner(course_id, courses!inner(is_published))",
      )
      .eq("id", lessonId)
      .eq("is_published", true)
      .eq("modules.course_id", courseId)
      .eq("modules.courses.is_published", true)
      .maybeSingle(),
  ]);
  if (grant.error) throw new Error("Рұқсатты тексеру мүмкін болмады.");
  if (!grant.data) notFound();
  if (unlocked.error) throw new Error("Сабақ рұқсатын тексеру мүмкін болмады.");
  if (!unlocked.data) notFound();
  if (result.error) throw new Error("Сабақты жүктеу мүмкін болмады.");
  if (!result.data) notFound();
  return { supabase, lesson: result.data };
}
