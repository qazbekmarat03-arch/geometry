import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  buildDashboard,
  type Course,
  type Progress,
} from "@/lib/dashboard/model";

export const getDashboardData = cache(async (courseId?: string) => {
  const user = await requireUser();
  const supabase = await createClient();
  let accessQuery = supabase
    .from("course_access")
    .select(
      "course_id, courses!inner(id, title, description, thumbnail_url, lesson_unlock_mode, created_at)",
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("courses.is_published", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  if (courseId) accessQuery = accessQuery.eq("course_id", courseId);
  const [profileResult, accessResult, progressResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .single(),
    accessQuery,
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed, video_progress, updated_at")
      .eq("user_id", user.id),
  ]);
  if (profileResult.error || accessResult.error || progressResult.error)
    throw new Error("Оқу деректерін жүктеу мүмкін болмады.");
  // Join through the user's grant under RLS: avoids a second courses round trip.
  const grantedCourses = (
    accessResult.data as unknown as {
      courses: Omit<Course, "modules"> & { created_at: string };
    }[]
  )
    .map((row) => row.courses)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  let courses: Course[] = [];
  if (grantedCourses.length) {
    courses = await Promise.all(
      grantedCourses.map(async (course) => {
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
