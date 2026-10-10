"use client";
import { useState } from "react";
import { importQuiz, type QuizQuestion } from "@/lib/quiz/import";
import { QuizText } from "@/components/course/quiz-text";
import { saveHomeworkMode } from "@/app/(admin)/admin/courses/quiz-actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
const example=String.raw`\qnum{1} Сыбайлас бұрыштардың қосындысы?
A) $90^\circ$ \\
B) $180^\circ$ \\
C) $270^\circ$ \\
D) $360^\circ$
\section{Үй тапсырмасының жауаптары мен шығарылу жолдары}
\begin{enumerate}
\item \textbf{Жауабы: B.} Сыбайлас бұрыштар жазық бұрышты құрайды: $180^\circ$.
\end{enumerate}`;
export function QuizEditor({lessonId,initialMode,initialSource}:{lessonId:string;initialMode:string;initialSource:string}) {
 const [mode,setMode]=useState(initialMode),[source,setSource]=useState(initialSource),[preview,setPreview]=useState<QuizQuestion[]>([]),[error,setError]=useState(''),[pending,setPending]=useState(false);
 const toast=useToast();
 function inspect(){try{setPreview(importQuiz(source));setError('');}catch(e){setPreview([]);setError(e instanceof Error?e.message:'Код дұрыс емес.');}}
 async function save(){setPending(true);setError('');try{const result=await saveHomeworkMode(lessonId,mode,source);if(!result.ok)setError(result.message);toast({message:result.message,error:!result.ok});}catch{setError('Қате орын алды. Қайта көріңіз.');}finally{setPending(false);}}
 return <section className="quiz-editor">
  <h2 className="text-xl font-semibold">Тапсырма түрі және тест</h2>
  <label className="mt-5 block">Үй тапсырмасын беру түрі<select className="premium-input mt-2 w-full" value={mode} onChange={e=>setMode(e.target.value)} disabled={pending}>
   <option value="pdf">Тек PDF — тест шегі жоқ</option><option value="quiz">Сайттағы тест — 80%-дан көп</option><option value="both">PDF және тест — 80%-дан көп</option>
  </select></label>
  <p className="my-4 text-sm text-muted">PDF файлын төменнен тіркеңіз. Тест немесе «екеуі бірге» таңдалса, оқушы келесі сабаққа өту үшін 80%-дан көп жинауы керек. Тест өзгерсе, бұрынғы нәтижелер жаңадан тапсыруды талап етеді.</p>
  <details className="mb-4"><summary className="cursor-pointer text-brand">TeXstudio кодының үлгісі</summary><pre className="overflow-auto p-3 text-xs">{example}</pre><p className="text-xs text-muted">1–100 сұрақ. Әрқайсысында A–D жауаптары және жауаптар бөлімінде шешімі болсын. $...$ формулалары, қарапайым TikZ: coordinate, draw, path, node, кесінділер мен доғалар қолданылады. Толық TeX бағдарламасы орындалмайды.</p></details>
  <label className="block">Тесттің TeX коды<textarea className="premium-input mt-2 min-h-64 w-full font-mono text-xs" value={source} maxLength={250000} onChange={e=>{setSource(e.target.value);setPreview([]);}} disabled={pending} spellCheck={false} /></label>
  {error&&<p role="alert" className="my-3 text-red-300">{error}</p>}
  <div className="my-4 flex flex-wrap gap-3"><Button variant="secondary" disabled={pending||!source.trim()} onClick={inspect}>Алдын ала қарау</Button><Button disabled={pending} onClick={()=>void save()}>{pending?'Сақталуда...':'Тапсырма түрін және тестті сақтау'}</Button></div>
  {!!preview.length&&<div className="quiz-preview"><p>{preview.length} сұрақ · өту үшін кемінде {Math.floor(preview.length*.8)+1} дұрыс жауап</p>{preview.map((q,i)=><details key={i}><summary>{i+1}-сұрақ · дұрыс жауап: {'ABCD'[q.answer]}</summary><QuizText text={q.prompt}/>{q.options.map((o,j)=><div key={j}>{'ABCD'[j]}) <QuizText text={o}/></div>)}<QuizText text={q.solution}/></details>)}</div>}
 </section>;
}
