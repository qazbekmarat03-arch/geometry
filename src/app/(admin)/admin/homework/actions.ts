"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { MAX_PDF_SIZE, pdfName, validPdfHeader } from "@/lib/homework/files";
export type UploadState = { ok: boolean; message: string };
export async function uploadHomework(
  _previous: UploadState,
  form: FormData,
): Promise<UploadState> {
  await requireAdmin();
  const lessonId = form.get("lessonId");
  const file = form.get("file");
  if (
    !validId(lessonId) ||
    !(file instanceof File) ||
    !/\.pdf$/i.test(file.name) ||
    file.type !== "application/pdf" ||
    file.size < 5 ||
    file.size > MAX_PDF_SIZE
  )
    return { ok: false, message: "10 МБ-тан аспайтын PDF файлын таңдаңыз." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validPdfHeader(bytes))
    return { ok: false, message: "Файл PDF пішіміне сәйкес келмейді." };
  const supabase = await createClient();
  const lesson = await supabase
    .from("lessons")
    .select("id, modules!inner(course_id)")
    .eq("id", lessonId)
    .maybeSingle();
  if (lesson.error || !lesson.data)
    return { ok: false, message: "Сабақ табылмады." };
  const row = lesson.data as unknown as {
    id: string;
    modules: { course_id: string };
  };
  const path = `${row.modules.course_id}/${lessonId}/${randomUUID()}.pdf`;
  const { error } = await supabase.storage
    .from("homework")
    .upload(path, bytes, {
      contentType: "application/pdf",
      upsert: false,
      cacheControl: "0",
    });
  if (error) return { ok: false, message: "Файл жүктелмеді. Қайта көріңіз." };
  const updated = await supabase
    .from("lessons")
    .update({
      homework_pdf_url: `storage://homework/${path}`,
      homework_file_name: pdfName(file.name),
      homework_uploaded_at: new Date().toISOString(),
    })
    .eq("id", lessonId)
    .select("id")
    .single();
  if (updated.error) {
    await supabase.storage.from("homework").remove([path]);
    return { ok: false, message: "Файл сабаққа тіркелмеді. Қайта көріңіз." };
  }
  revalidatePath("/admin/homework");
  revalidatePath("/admin/courses", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "PDF тапсырмасы сабаққа тіркелді." };
}
