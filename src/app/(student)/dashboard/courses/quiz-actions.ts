"use server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validId } from "@/lib/course/media";
import { revalidatePath } from "next/cache";
import type { QuizView } from "@/lib/quiz/import";
export async function submitQuiz(lessonId:string,version:number,round:number,answers:Record<string,number>):Promise<{data?:QuizView;error?:string}> {
 await requireUser();
 if(!validId(lessonId)||!Number.isSafeInteger(version)||!Number.isSafeInteger(round)||!answers||typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).length>100||Object.entries(answers).some(([k,v])=>!/^\d{1,2}$/.test(k)||!Number.isInteger(v)||v<0||v>3)) return {error:'Жауаптар дұрыс емес.'};
 const db=await createClient();
 const {data,error}=await db.rpc('submit_lesson_quiz',{target_lesson:lessonId,quiz_version:version,expected_round:round,answers});
 if(error) return {error:error.code==='42501'?'Қолжетімділік жоқ.':'Тест өзгерген немесе жауаптар толық емес. Бетті жаңартып, қайта көріңіз.'};
 revalidatePath('/dashboard','layout');
 return {data:data as QuizView};
}
