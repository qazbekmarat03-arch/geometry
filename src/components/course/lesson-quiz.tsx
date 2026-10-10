"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/app/(student)/dashboard/courses/quiz-actions";
import type { QuizView } from "@/lib/quiz/import";
import { QuizText } from "./quiz-text";
import { Button } from "@/components/ui/button";
export function LessonQuiz({lessonId,initial}:{lessonId:string;initial:QuizView}) {
 const [quiz,setQuiz]=useState(initial),[answers,setAnswers]=useState<Record<string,number>>({}),[pending,setPending]=useState(false),[error,setError]=useState('');const router=useRouter();
 const remaining=quiz.questions.filter(q=>!q.correct);
 async function submit(){setPending(true);setError('');try{const result=await submitQuiz(lessonId,quiz.version,quiz.round,answers);if(result.error)setError(result.error);else if(result.data){setQuiz(result.data);setAnswers({});router.refresh();}}catch{setError('Қате орын алды. Қайта көріңіз.');}finally{setPending(false);}}
 return <section className="quiz-homework" aria-label="Үй тапсырмасы — тест">
  <p className="eyebrow text-brand">БІЛІМІҢДІ БЕКІТ</p><h3 className="my-3 text-2xl">Үй тапсырмасы · тест</h3>
  <p className="text-sm text-muted">Келесі сабаққа өту үшін 80%-дан көп: кемінде {Math.floor(quiz.total*.8)+1} / {quiz.total} дұрыс жауап. Дұрыс жауаптарың сақталады.</p>
  <div role="status" className="quiz-score">{quiz.correctCount} / {quiz.total} дұрыс · {Math.round(quiz.correctCount/quiz.total*100)}%{quiz.passed?' — Тесттен өттің! Сабақ аяқталды.':quiz.round?` — ${remaining.length} сұрақты қайта орында.`:''}</div>
  {!!remaining.length&&<form onSubmit={e=>{e.preventDefault();void submit();}}>
   {remaining.map(q=><fieldset className="quiz-question" key={`${quiz.round}-${q.id}`} disabled={pending}><legend>{q.id+1}-сұрақ</legend><QuizText text={q.prompt}/>
    <div className="quiz-options">{q.options.map((option,i)=><label key={i}><input type="radio" name={`question-${q.id}`} value={i} required checked={answers[q.id]===i} onChange={()=>setAnswers({...answers,[q.id]:i})}/><span>{'ABCD'[i]}</span><QuizText text={option}/></label>)}</div>
    {q.solution&&<details className="quiz-solution" open><summary>Екі әрекеттен кейінгі шығарылу жолы</summary><QuizText text={q.solution}/><p>Дұрыс жауап: {'ABCD'[q.answer!]}. Шешімін түсініп, жауабыңды қайта белгіле.</p></details>}
   </fieldset>)}
   {error&&<p role="alert" className="my-4 text-red-300">{error}</p>}
   <Button disabled={pending||Object.keys(answers).length!==remaining.length} type="submit">{pending?'Тексерілуде...':quiz.round?'Қате сұрақтарды қайта тапсыру':'Жауаптарды тексеру'}</Button>
   <p className="mt-3 text-xs text-muted">Таңдалғаны: {Object.keys(answers).length} / {remaining.length}. Екінші рет қате кеткен сұрақтардың шешімдері көрсетіледі.</p>
  </form>}
 </section>;
}
