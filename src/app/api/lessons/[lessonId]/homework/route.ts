import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  authorizeLessonResource,
  VideoAccessError,
} from "@/lib/video/authorize";
import { homeworkReference, pdfName } from "@/lib/homework/files";
import { createStorageSigningClient } from "@/lib/supabase/storage-signing";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    if (!getSupabaseConfig())
      return NextResponse.json(
        { error: "Қызмет әзірге қолжетімсіз." },
        { status: 503, headers },
      );
    const { lessonId } = await params;
    const supabase = await createClient();
    const access = await authorizeLessonResource(
      supabase,
      lessonId,
      "homework_pdf_url",
    );
    const reference = homeworkReference(access.reference);
    if (!reference)
      return NextResponse.json(
        { error: "PDF тапсырмасы табылмады." },
        { status: 404, headers },
      );
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.min(
      300,
      access.grantExpiresAt
        ? Math.floor(Date.parse(access.grantExpiresAt) / 1000) - now
        : 300,
    );
    if (!Number.isFinite(ttl) || ttl < 1)
      return NextResponse.json(
        { error: "Курсқа рұқсат мерзімі аяқталды." },
        { status: 403, headers },
      );
    const download = new URL(request.url).searchParams.get("download") === "1";
    const name = pdfName(
      access.fileName || reference.path.split("/").pop() || "homework.pdf",
    );
    const { data, error } = await createStorageSigningClient()
      .storage.from(reference.bucket)
      .createSignedUrl(
        reference.path,
        ttl,
        download ? { download: name } : undefined,
      );
    if (error || !data)
      return NextResponse.json(
        { error: "PDF жүктелмеді. Қайта көріңіз." },
        { status: 503, headers },
      );
    return NextResponse.json(
      { url: data.signedUrl, expiresAt: now + ttl },
      { headers },
    );
  } catch (error) {
    const status = error instanceof VideoAccessError ? error.status : 503;
    return NextResponse.json(
      {
        error:
          status === 401
            ? "Аккаунтыңызға қайта кіріңіз."
            : status === 403 || status === 404
              ? "Бұл тапсырмаға рұқсат жоқ."
              : "PDF жүктелмеді. Қайта көріңіз.",
      },
      { status, headers },
    );
  }
}
