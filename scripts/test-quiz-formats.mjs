import test from 'node:test';
import assert from 'node:assert/strict';
import { importQuiz, combineQuizSource } from '../src/lib/quiz/import.ts';
import { importPractice } from '../src/lib/quiz/practice-import.ts';
import { normalizeQuizSource } from '../src/lib/quiz/normalize-source.ts';
const solution=String.raw`\begin{enumerate}
\item Жауабы: B.
$2+2=4$.
\end{enumerate}`;
const questions=String.raw`\question $2+2=?$
\begin{choices}
\choice $3$
\CorrectChoice $4$
\choice $5$
\choice $6$
\end{choices}`;
test('exam choices, full standalone documents and fences import in both editors',()=>{
 for(const q of [questions,`\\documentclass{exam}\n\\begin{document}\n${questions}\n\\end{document}`, '```latex\n'+questions+'\n```']) {
  const combined=combineQuizSource(q,`\\begin{document}\n${solution}\n\\end{document}`);
  for(const parse of [importQuiz,importPractice]) {
   const [item]=parse(combined);
   assert.equal(item.answer,1);
   assert.deepEqual(item.options,['$3$','$4$','$5$','$6$']);
   assert.match(item.solution,/2\+2=4/);
  }
 }
});
test('Cyrillic and alternative labels normalize without changing formulas',()=>{
 for(const labels of [['А)','В)','С)','Д)'],['A.','B.','C.','D.'],['(A)','(B)','(C)','(D)']]) {
  const q='\\qnum{1} $2+2=?$\n'+labels.map((l,i)=>l+' $'+(i+3)+'$').join('\n');
  assert.equal(importQuiz(combineQuizSource(q,solution))[0].answer,1);
 }
 const math=String.raw`$\begin{matrix}1&2\\3&4\end{matrix}$`;
 assert.equal(normalizeQuizSource(math),math);
});
test('normalization never guesses missing answer keys or runs macros',()=>{
 assert.throws(()=>importQuiz(questions),/Жауаптар/);
 assert.equal(normalizeQuizSource(String.raw`\input{secret.tex}`),String.raw`\input{secret.tex}`);
 assert.throws(()=>normalizeQuizSource('a'.repeat(250001)),/250 000/);
});
