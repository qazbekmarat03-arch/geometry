import test from 'node:test';
import assert from 'node:assert/strict';
import { importQuiz, combineQuizSource, splitQuizSource } from '../src/lib/quiz/import.ts';
import { parseDiagram } from '../src/lib/quiz/diagram.ts';
const questions=String.raw`\qnum{1} $x$?
A) $1$ \\
B) $2$ \\
C) $3$ \\
D) $4$
\subsection*{Next level}`;
const solutions=String.raw`\begin{enumerate}
\item \textbf{Жауабы: B.} $x=2$.
\end{enumerate}`;
test('separate solutions, combined legacy source and headings round-trip',()=>{
 for(const heading of ['Үй тапсырмасының толық шешу жолдары','Үй тапсырмасының жауаптары мен шығарылу жолдары']){
  const source=combineQuizSource(questions,`\\section*{${heading}}\n${solutions}`);
  const parts=splitQuizSource(source);
  assert.equal(combineQuizSource(parts.questions,parts.solutions),source);
  const [q]=importQuiz(source);assert.equal(q.answer,1);assert.equal(q.options[3],'$4$');
 }
 assert.equal(importQuiz(combineQuizSource(questions,solutions)).length,1);
});
test('reject duplicate answer sections and missing options',()=>{
 const source=combineQuizSource(questions,solutions);
 assert.throws(()=>combineQuizSource(source,solutions));
 assert.throws(()=>importQuiz(source.replace('D)', 'E)')));
 assert.throws(()=>importQuiz(questions));
});
test('triangle cycle closes and barycentric extension resolves safely',()=>{
 const d=parseDiagram(String.raw`\begin{tikzpicture}
 \coordinate (A) at (0,0); \coordinate (B) at (2,3); \coordinate (C) at (5,0);
 \draw (A) -- (B) -- (C) -- cycle;
 \draw (A) -- (barycentric cs:B=-0.5,A=1.5);
 \end{tikzpicture}`);
 assert.match(d.paths[0].d,/Z/);assert.match(d.paths[1].d,/L-50,75/);
 assert.throws(()=>parseDiagram(String.raw`\draw (constructor) -- (0,0);`));
 assert.throws(()=>parseDiagram(String.raw`\input{secret}`));
});
test('arc center comes from current point and start angle',()=>{
 const direct=parseDiagram(String.raw`\draw (4.4,0) arc (0:90:0.4);`);
 const offset=parseDiagram(String.raw`\draw (4,0) ++(0:0.4) arc (0:90:0.4);`);
 const end=s=>s.match(/L([^L]+) $/)[1].trim().split(',').map(Number);
 const [x,y]=end(direct.paths[0].d);assert.ok(Math.abs(x-200)<1e-8);assert.ok(Math.abs(y+20)<1e-8);
 assert.deepEqual(end(direct.paths[0].d),end(offset.paths[0].d));
});
