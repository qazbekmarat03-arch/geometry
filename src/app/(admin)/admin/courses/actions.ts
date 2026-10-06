"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { videoReference } from "@/lib/admin/editor-validation";

export type EditorState = { ok: boolean; message: string };
export async function editContent(
  _state: EditorState,
  form: FormData,
): Promise<EditorState> {
  await requireAdmin();
  const db = await createClient();
  const operation = String(form.get("operation") ?? "");
  const kind = String(form.get("kind") ?? "");
  const id = form.get("id");
  const parent = form.get("parent");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const table =
    kind === "course"
      ? "courses"
      : kind === "module"
        ? "modules"
        : kind === "lesson"
          ? "lessons"
          : null;
  if (!table || (operation !== "create" && !validId(id)))
    return { ok: false, message: "Мәлімет дұрыс емес." };
  let destination: string | null = null;
  let error;
  if (operation === "move" && kind !== "course") {
    const direction = Number(form.get("direction"));
    if (![1, -1].includes(direction))
      return { ok: false, message: "Бағыт дұрыс емес." };
    ({ error } = await db.rpc("admin_move_curriculum_item", {
      item_kind: kind,
      item_id: id,
      direction,
    }));
  } else if (operation === "delete") {
    // Resolve the redirect from stored relations, never a submitted parent URL.
    if (kind === "lesson") {
      const row = await db
        .from("lessons")
        .select("modules!inner(course_id)")
        .eq("id", id)
        .single();
      if (row.error) return { ok: false, message: "Сабақ табылмады." };
      destination = `/admin/courses/${(row.data as unknown as { modules: { course_id: string } }).modules.course_id}`;
    }
    const result = await db
      .from(table)
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    error = result.error;
    if (kind === "course") destination = "/admin/courses";
  } else if (operation === "publish" && kind === "course") {
    ({ error } = await db
      .from("courses")
      .update({ is_published: form.get("published") === "true" })
      .eq("id", id)
      .select("id")
      .single());
  } else if (operation === "remove_homework" && kind === "lesson") {
    ({ error } = await db
      .from("lessons")
      .update({
        homework_pdf_url: null,
        homework_file_name: null,
        homework_uploaded_at: null,
      })
      .eq("id", id)
      .select("id")
      .single());
  } else if (operation === "save" || operation === "create") {
    if (!title || title.length > 200 || description.length > 10000)
      return {
        ok: false,
        message:
          "Атауды (200 таңбаға дейін) және сипаттаманы (10 000 таңбаға дейін) тексеріңіз.",
      };
    if (operation === "create" && kind !== "course") {
      if (!validId(parent))
        return { ok: false, message: "Курс немесе модуль табылмады." };
      const result = await db.rpc("admin_add_curriculum_item", {
        item_kind: kind,
        parent_id: parent,
        item_title: title,
      });
      error = result.error;
      if (!error && kind === "lesson")
        destination = `/admin/courses/lessons/${result.data}`;
    } else {
      const fields: Record<string, unknown> = {
        title,
        description: description || null,
      };
      if (kind !== "module")
        fields.is_published = form.get("published") === "on";
      if (kind === "course") {
        const mode = form.get("lesson_unlock_mode");
        if (mode !== "all" && mode !== "sequential")
          return { ok: false, message: "Сабақтардың ашылу тәртібін таңдаңыз." };
        fields.lesson_unlock_mode = mode;
      }
      if (kind === "lesson") {
        const durationValue = String(form.get("duration") ?? "");
        const duration = Number(durationValue);
        if (
          !/^\d+$/.test(durationValue) ||
          !Number.isSafeInteger(duration) ||
          duration > 2147483647
        )
          return {
            ok: false,
            message: "Ұзақтығын секундпен, бүтін сан түрінде енгізіңіз.",
          };
        fields.duration = duration;
        try {
          fields.video_url = videoReference(String(form.get("video") ?? ""));
        } catch {
          return {
            ok: false,
            message:
              "YouTube сілтемесі, YouTube Video ID, Bunny Video ID, bunny://…, storage://course-media/… немесе vimeo://… енгізіңіз. Ашық MP4 сілтемелері қабылданбайды.",
          };
        }
      }
      const result =
        operation === "create"
          ? await db.from(table).insert(fields).select("id").single()
          : await db
              .from(table)
              .update(fields)
              .eq("id", id)
              .select("id")
              .single();
      error = result.error;
      if (!error && operation === "create")
        destination = `/admin/courses/${result.data!.id}`;
    }
  } else return { ok: false, message: "Әрекет дұрыс емес." };
  if (error)
    return {
      ok: false,
      message: "Өзгеріс сақталмады. Бетті жаңартып, қайта көріңіз.",
    };
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  if (destination) redirect(`${destination}?notice=saved`);
  return { ok: true, message: "Өзгерістер сақталды" };
}
