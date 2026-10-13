"use server";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import type { PracticeView } from "@/lib/practice";
export async function submitPractice(
  id: string,
  version: number,
  answers: (number | number[])[],
): Promise<{ data?: PracticeView; error?: string }> {
  if (
    !validId(id) ||
    !Number.isInteger(version) ||
    !Array.isArray(answers) ||
    answers.length < 1 ||
    answers.length > 100 ||
    answers.some((v) =>
      Array.isArray(v)
        ? v.length < 1 ||
          v.length > 6 ||
          v.some((n) => !Number.isInteger(n) || n < 0 || n > 5)
        : !Number.isInteger(v) || v < 0 || v > 5,
    )
  )
    return { error: "Барлық сұрақтарға жауап беріңіз." };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Қайта кіріңіз." };
  const { data, error } = await db.rpc("submit_practice", {
    target: id,
    expected_version: version,
    chosen: answers,
  });
  return error
    ? { error: "Сақталмады. Қолжетімділікті тексеріп, бетті жаңартыңыз." }
    : { data };
}
