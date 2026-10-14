import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { TheoryEditor } from "@/components/admin/theory-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (id !== "new" && !validId(id)) notFound();
  const db = await createClient();
  const { data: courses, error } = await db
    .from("courses")
    .select("id,title")
    .order("title");
  if (error) throw new Error("Курстар жүктелмеді.");
  let topic;
  if (id !== "new") {
    const result = await db
      .from("theory_topics")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (result.error) throw new Error("Теория жүктелмеді.");
    if (!result.data) notFound();
    topic = result.data;
  }
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8">{topic ? "Теорияны өңдеу" : "Жаңа теория"}</h1>
      <TheoryEditor courses={courses || []} topic={topic} />
    </div>
  );
}
