"use server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { revalidatePath } from "next/cache";
export async function saveTheory(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || ""),
    course_id = String(form.get("course_id") || "");
  const title = String(form.get("title") || "").trim(),
    source = String(form.get("source") || "").trim();
  const position = Number(form.get("position"));
  if (
    (id && !validId(id)) ||
    !validId(course_id) ||
    !title ||
    title.length > 160 ||
    !source ||
    source.length > 100000 ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 10000
  )
    return {
      ok: false,
      message:
        "Тақырып, курс және TeX кодын тексеріңіз (100 000 таңбаға дейін).",
    };
  const db = await createClient();
  const record = {
    course_id,
    title,
    source,
    position,
    is_published: form.get("is_published") === "on",
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await db
        .from("theory_topics")
        .update(record)
        .eq("id", id)
        .select("id")
        .single()
    : await db.from("theory_topics").insert(record).select("id").single();
  if (result.error)
    return {
      ok: false,
      message: "Теория сақталмады. Дерекқор баптауын тексеріп, қайта көріңіз.",
    };
  revalidatePath("/admin/theory");
  revalidatePath("/dashboard/theory", "layout");
  return { ok: true, message: "Өзгерістер сақталды" };
}
