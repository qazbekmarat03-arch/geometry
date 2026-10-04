"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";

export type StudentActionState = { ok: boolean; message: string };
export async function setCourseAccess(
  _previous: StudentActionState,
  form: FormData,
): Promise<StudentActionState> {
  await requireAdmin();
  const studentId = form.get("studentId");
  const courseId = form.get("courseId");
  const mode = form.get("mode");
  const date = form.get("date");
  if (
    !validId(studentId) ||
    !validId(courseId) ||
    typeof mode !== "string" ||
    !["none", "30", "60", "90", "custom", "remove"].includes(mode) ||
    (mode === "custom" &&
      (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)))
  )
    return {
      ok: false,
      message: "Курс пен қолжетімділік мерзімін дұрыс таңдаңыз.",
    };
  const db = await createClient();
  const { error } = await db.rpc("admin_set_course_access", {
    student_id: studentId,
    target_course_id: courseId,
    access_mode: mode,
    custom_date: mode === "custom" ? date : null,
  });
  if (error)
    return {
      ok: false,
      message: "Өзгеріс сақталмады. Күннің өтпегенін тексеріп, қайта көріңіз.",
    };
  refreshStudents();
  return {
    ok: true,
    message:
      mode === "remove"
        ? "Курсқа рұқсат жойылды."
        : "Курсқа қолжетімділік сақталды.",
  };
}
function refreshStudents() {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
}

export async function manageStudent(
  _previous: StudentActionState,
  form: FormData,
): Promise<StudentActionState> {
  await requireAdmin();
  const operation = form.get("operation");
  const studentId = form.get("studentId");
  const accessId = form.get("accessId");
  const invitationId = form.get("invitationId");
  const db = await createClient();
  let error;
  if (operation === "revoke_invitation" && validId(invitationId)) {
    ({ error } = await db.rpc("admin_revoke_invitation", {
      invitation_id: invitationId,
    }));
  } else if (
    validId(studentId) &&
    ["activate", "deactivate", "remove_access"].includes(String(operation)) &&
    (operation !== "remove_access" || validId(accessId))
  ) {
    ({ error } = await db.rpc("admin_manage_student", {
      target_id: studentId,
      operation,
      access_id: operation === "remove_access" ? accessId : null,
    }));
  } else
    return {
      ok: false,
      message: "Мәлімет дұрыс емес. Бетті жаңартып көріңіз.",
    };
  if (error)
    return {
      ok: false,
      message: "Өзгеріс сақталмады. Бетті жаңартып, қайта көріңіз.",
    };
  refreshStudents();
  return { ok: true, message: "Өзгеріс сақталды." };
}

export async function addStudent(
  _previous: StudentActionState,
  form: FormData,
): Promise<StudentActionState> {
  await requireAdmin();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const courseId = form.get("courseId");
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !validId(courseId)
  )
    return {
      ok: false,
      message: "Дұрыс email мекенжайын енгізіп, курсты таңдаңыз.",
    };
  const db = await createClient();
  const { error } = await db
    .from("student_invitations")
    .insert({ email, course_id: courseId });
  if (error)
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Бұл email үшін осы курсқа рұқсат бұрын берілген."
          : "Рұқсат сақталмады. Қайта көріңіз.",
    };
  refreshStudents();
  return {
    ok: true,
    message:
      "Email сақталды. Оқушы осы Google аккаунтымен кіргенде курс ашылады. Белсенді емес аккаунтты бөлек белсендіріңіз.",
  };
}
