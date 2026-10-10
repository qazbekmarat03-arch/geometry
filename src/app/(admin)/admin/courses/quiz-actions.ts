"use server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { importQuiz } from "@/lib/quiz/import";
import { validId } from "@/lib/course/media";
import { revalidatePath } from "next/cache";
export async function saveHomeworkMode(lessonId: string, mode: string, source: string) {
  await requireAdmin();
  if(!validId(lessonId)||!['pdf','quiz','both'].includes(mode)||typeof source!=='string'||source.length>250000)
    return {ok:false,message:'Мәлімет дұрыс емес.'};
  let questions;
  try {questions=source.trim()?importQuiz(source):[]; if(mode!=='pdf'&&!questions.length) throw new Error('Тест кодын енгізіңіз.');}
  catch(error) {return {ok:false,message:error instanceof Error?error.message:'Кодты тексеріңіз.'};}
  const db=await createClient();
  const {error}=await db.rpc('admin_save_homework',{target_lesson:lessonId,homework_mode:mode,latex_source:source,quiz_questions:questions});
  if(error) return {ok:false,message:'Өзгерістер сақталмады. Қайта көріңіз.'};
  revalidatePath('/dashboard','layout');revalidatePath('/admin','layout');
  return {ok:true,message:'Өзгерістер сақталды'};
}
