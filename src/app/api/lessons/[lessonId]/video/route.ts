import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { authorizeLessonVideo, VideoAccessError } from "@/lib/video/authorize";
import { createVideoPlayback } from "@/lib/video/provider";
import { createStorageSigningClient } from "@/lib/supabase/storage-signing";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    if (!getSupabaseConfig())
      return NextResponse.json(
        { error: "Видео әзірге қолжетімсіз." },
        { status: 503, headers },
      );
    const { lessonId } = await params;
    const supabase = await createClient();
    const access = await authorizeLessonVideo(supabase, lessonId);
    const playback = await createVideoPlayback(
      access.reference,
      createStorageSigningClient,
      access.grantExpiresAt,
    );
    return NextResponse.json(playback, { headers });
  } catch (error) {
    const status = error instanceof VideoAccessError ? error.status : 503;
    // Never serialize provider errors, source references, tokens, or credentials.
    return NextResponse.json(
      {
        error:
          status === 401
            ? "Аккаунтыңызға қайта кіріңіз."
            : status === 403 || status === 404
              ? "Бұл сабаққа рұқсат жоқ."
              : "Видео әзірге қолжетімсіз.",
      },
      { status, headers },
    );
  }
}
