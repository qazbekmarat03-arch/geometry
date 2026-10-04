import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class VideoAccessError extends Error {
  public status: 400 | 401 | 403 | 404 | 503;
  constructor(status: 400 | 401 | 403 | 404 | 503) {
    super("Video access unavailable");
    this.status = status;
  }
}
// Isolated from page redirects. API callers get JSON status codes, never HTML.
export async function authorizeLessonResource(
  supabase: SupabaseClient,
  lessonId: string,
  resource: "video_url" | "homework_pdf_url",
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      lessonId,
    )
  )
    throw new VideoAccessError(400);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new VideoAccessError(401);
  if (!user.email || !user.email_confirmed_at) throw new VideoAccessError(403);
  const profile = await supabase
    .from("profiles")
    .select("email,is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (profile.error) throw new VideoAccessError(503);
  if (
    !profile.data?.is_active ||
    profile.data.email?.trim().toLowerCase() !== user.email.trim().toLowerCase()
  )
    throw new VideoAccessError(403);
  const lesson = await supabase
    .from("lessons")
    .select(
      `${resource}, homework_file_name, modules!inner(course_id, courses!inner(is_published))`,
    )
    .eq("id", lessonId)
    .eq("is_published", true)
    .eq("modules.courses.is_published", true)
    .maybeSingle();
  if (lesson.error) throw new VideoAccessError(503);
  if (!lesson.data) throw new VideoAccessError(404);
  const row = lesson.data as unknown as {
    video_url: string | null;
    homework_pdf_url: string | null;
    homework_file_name: string | null;
    modules: { course_id: string };
  };
  // Course identity is derived from the database, not request parameters.
  const grant = await supabase
    .from("course_access")
    .select("expires_at")
    .eq("user_id", user.id)
    .eq("course_id", row.modules.course_id)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (grant.error) throw new VideoAccessError(503);
  if (!grant.data) throw new VideoAccessError(403);
  const unlocked = await supabase.rpc("can_access_lesson", {
    target_lesson: lessonId,
  });
  if (unlocked.error) throw new VideoAccessError(503);
  if (!unlocked.data) throw new VideoAccessError(403);
  return {
    reference: row[resource],
    fileName: row.homework_file_name,
    grantExpiresAt: grant.data.expires_at as string | null,
  };
}
export async function authorizeLessonVideo(
  supabase: SupabaseClient,
  lessonId: string,
) {
  const { reference, grantExpiresAt } = await authorizeLessonResource(
    supabase,
    lessonId,
    "video_url",
  );
  return { reference, grantExpiresAt };
}
