"use server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { importPractice } from "@/lib/quiz/practice-import";
import { validId } from "@/lib/course/media";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function savePracticeMetadata(form: FormData) {
  await requireAdmin();
  const db = await createClient();
  const id = String(form.get("id") || ""),
    title = String(form.get("title") || "").trim(),
    description = String(form.get("description") || "").trim();
  if (
    !title ||
    title.length > 160 ||
    description.length > 3000 ||
    (id && !validId(id))
  )
    throw new Error("Мәлімет дұрыс емес.");
  const record = {
    title,
    description,
    is_free: form.get("is_free") === "on",
    is_published: form.get("is_published") === "on",
  };
  if (record.is_published) {
    const { data } = await db
      .from("practice_content")
      .select("exam_id")
      .eq("exam_id", id)
      .maybeSingle();
    if (!data) throw new Error("Алдымен тест тапсырмаларын сақтаңыз.");
  }
  const result = id
    ? await db
        .from("practice_exams")
        .update(record)
        .eq("id", id)
        .select("id")
        .single()
    : await db.from("practice_exams").insert(record).select("id").single();
  if (result.error) throw new Error("Өзгерістер сақталмады.");
  revalidatePath("/practice");
  revalidatePath("/admin/practice");
  redirect("/admin/practice/" + result.data.id);
}
export async function savePracticeQuiz(
  id: string,
  _mode: string,
  source: string,
) {
  await requireAdmin();
  if (!validId(id) || typeof source !== "string" || source.length > 250000)
    return { ok: false, message: "Мәлімет дұрыс емес." };
  try {
    const questions = importPractice(source);
    const { error } = await (
      await createClient()
    ).rpc("admin_save_practice", {
      target: id,
      latex_source: source,
      quiz_questions: questions,
    });
    if (error) return { ok: false, message: "Тест сақталмады. Қайта көріңіз." };
    revalidatePath("/practice", "layout");
    revalidatePath("/admin/practice", "layout");
    return { ok: true, message: "Өзгерістер сақталды" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Қате орын алды",
    };
  }
}
export async function changePracticeAccess(
  id: string,
  email: string,
  grant: boolean,
) {
  await requireAdmin();
  if (
    !validId(id) ||
    typeof email !== "string" ||
    email.length > 254 ||
    typeof grant !== "boolean"
  )
    return { ok: false, message: "Мәлімет дұрыс емес." };
  const db = await createClient();
  const { data: user } = await db
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!user)
    return {
      ok: false,
      message: "Оқушы алдымен Google арқылы тіркелуі керек.",
    };
  const result = grant
    ? await db
        .from("practice_access")
        .upsert(
          { exam_id: id, user_id: user.id },
          { onConflict: "exam_id,user_id", ignoreDuplicates: true },
        )
    : await db
        .from("practice_access")
        .delete()
        .eq("exam_id", id)
        .eq("user_id", user.id);
  if (result.error)
    return { ok: false, message: "Қолжетімділік өзгермеді. Қайта көріңіз." };
  revalidatePath("/admin/practice/" + id);
  revalidatePath("/practice");
  return {
    ok: true,
    message: grant ? "Қолжетімділік ашылды" : "Қолжетімділік жабылды",
  };
}
