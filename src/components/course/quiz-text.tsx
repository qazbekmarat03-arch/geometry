import katex from "katex";
import "katex/dist/katex.min.css";
import { parseDiagram } from "@/lib/quiz/diagram";

function MathText({ text }: { text: string }) {
  return <>{text.split(/(\$[^$]+\$)/g).map((part,i)=>part.startsWith('$') && part.endsWith('$') ?
    <span key={i} dangerouslySetInnerHTML={{__html:katex.renderToString(part.slice(1,-1),{trust:false,throwOnError:false,strict:'ignore',maxExpand:200,maxSize:10})}} /> : <span key={i}>{part}</span>)}</>;
}
export function QuizText({ text }: { text: string }) {
  return <div className="quiz-text">{text.split(/(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g).map((part,i)=>{
    if(!part.startsWith('\\begin{tikzpicture}')) return <MathText key={i} text={part} />;
    try {
      const d=parseDiagram(part);
      return <figure className="quiz-diagram" key={i}><svg viewBox={d.viewBox} role="img" aria-label="Есептің геометриялық сызбасы">
        {d.paths.map((p,j)=><path key={j} d={p.d} fill="none" stroke="currentColor" strokeWidth={p.thick?2:1.2} strokeDasharray={p.dashed?'6 4':undefined} />)}
        {d.dots.map((p,j)=><circle key={j} cx={p[0]*50} cy={-p[1]*50} r="3" fill="currentColor" />)}
        {d.labels.map((l,j)=><foreignObject key={j} x={l.at[0]*50-65} y={-l.at[1]*50-13} width="130" height="36"><div className="quiz-diagram-label"><MathText text={l.text} /></div></foreignObject>)}
      </svg><figcaption>Сызба масштабпен берілмеген.</figcaption></figure>;
    } catch {return <p key={i} role="alert">Сызбаны көрсету мүмкін болмады. Мұғалімге хабарласыңыз.</p>;}
  })}</div>;
}
