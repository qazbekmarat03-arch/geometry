import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { authorizeLessonVideo, VideoAccessError } from "@/lib/video/authorize";
import { readLimitedJson, InvalidRequestBody } from "@/lib/http/limited-json";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const reply = (status: number) =>
    NextResponse.json(
      { ok: status === 200 },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return reply(403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply(400);
  if (!getSupabaseConfig()) return reply(503);
  try {
    const input = await readLimitedJson(request, 512);
    if (!input || typeof input !== "object" || Array.isArray(input))
      return reply(400);
    const body = input as Record<string, unknown>;
    if (
      !body ||
      typeof body.seconds !== "number" ||
      !Number.isInteger(body.seconds) ||
      body.seconds < 0 ||
      body.seconds > 2147483646 ||
      typeof body.observedAt !== "string" ||
      !Number.isFinite(Date.parse(body.observedAt))
    )
      return reply(400);
    const { lessonId } = await params;
    const db = await createClient();
    await authorizeLessonVideo(db, lessonId);
    const { error } = await db.rpc("save_playback_position", {
      target_lesson: lessonId,
      playback_seconds: body.seconds,
      observed_at: body.observedAt,
    });
    return reply(error ? (error.code === "42501" ? 403 : 400) : 200);
  } catch (error) {
    return reply(
      error instanceof VideoAccessError
        ? error.status
        : error instanceof InvalidRequestBody
          ? 400
          : 503,
    );
  }
}
