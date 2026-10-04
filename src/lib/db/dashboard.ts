import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  buildDashboard,
  type Course,
  type Progress,
} from "@/lib/dashboard/model";

export const getDashboardData = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const [profileResult, accessResult, progressResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("course_access")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed, video_progress, updated_at")
      .eq("user_id", user.id),
  ]);
  if (profileResult.error || accessResult.error || progressResult.error)
    throw new Error("Оқу деректерін жүктеу мүмкін болмады.");
  const ids = accessResult.data.map((row) => row.course_id as string);
  let courses: Course[] = [];
  if (ids.length) {
    const result = await supabase
      .from("courses")
      .select("id, title, description, thumbnail_url, lesson_unlock_mode")
      .in("id", ids)
      .eq("is_published", true)
      .order("created_at", { ascending: true });
    if (result.error) throw new Error("Курстарды жүктеу мүмкін болмады.");
    courses = await Promise.all(
      result.data.map(async (course) => {
        const outline = await supabase.rpc("get_course_curriculum", {
          target_course: course.id,
        });
        if (outline.error)
          throw new Error("Курс бағдарламасын жүктеу мүмкін болмады.");
        return { ...course, modules: outline.data } as Course;
      }),
    );
  }
  return {
    profile: profileResult.data as {
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    },
    ...buildDashboard(courses, progressResult.data as Progress[]),
  };
});
