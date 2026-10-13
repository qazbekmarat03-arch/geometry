import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePracticeQuestions,
  importPractice,
  practiceSolutionTemplate,
} from "../src/lib/quiz/practice-import.ts";
import { combineQuizSource, importQuiz } from "../src/lib/quiz/import.ts";
import { plotExpression } from "../src/lib/quiz/plot-expression.ts";
const source = String.raw`\question $x$?
\noindent
A) $1$ \\[0.15cm]
B) $2$ \\
C) $3$ \\
D) $4$
\question Сәйкестендіріңіз.
\begin{tabular}{|>{\raggedright\arraybackslash}p{9cm}|p{6cm}|}
\hline
1) $x$ & \multirow{3.5}{6cm}{A) $1$ \newline B) $2$ \newline C) $3$ \newline D) $4$} \\[0.9cm]
\cline{1-1}
2) $y$ & \\
\end{tabular}
\question Жұп сандарды таңдаңыз.
A) 1
B) 2
C) 3
D) 4
E) 5
F) 6`;
const solutions = String.raw`\qnum{1} Жауабы: B
$x=2$.
\qnum{2} Жауабы: 1-B, 2-C
$x=2$, $y=3$.
\qnum{3} Жауабы: F, B, D
$2$, $4$, $6$ — жұп сандар.`;
test("question, spacing, nested table groups and multiple answers", () => {
  const q = importPractice(combineQuizSource(source, solutions));
  assert.deepEqual(
    q.map((v) => v.kind),
    ["single", "matching", "multiple"],
  );
  assert.equal(q[0].options[0], "$1$");
  assert.deepEqual(q[1].rows, ["$x$", "$y$"]);
  assert.deepEqual(q[1].answer, [1, 2]);
  assert.deepEqual(q[2].answer, [1, 3, 5]);
  assert.equal(q[1].options[3], "$4$");
});
test("missing keys can preview but cannot save; template is never an answer key", () => {
  assert.equal(parsePracticeQuestions(source).length, 3);
  assert.throws(() => importPractice(source), /өрісін/);
  assert.throws(() =>
    importPractice(combineQuizSource(source, practiceSolutionTemplate(source))),
  );
  assert.throws(() =>
    importPractice(
      combineQuizSource(source, solutions.replace("F, B, D", "B, B")),
    ),
  );
  assert.throws(() =>
    importPractice(
      combineQuizSource(source, solutions.replace("1-B, 2-C", "1-B")),
    ),
  );
});
test("legacy homework still accepts question and qnum with one answer", () => {
  const one = source.split("\\question Сәйкестендіріңіз.")[0];
  const s = String.raw`\item \textbf{Жауабы: B.} $x=2$.`;
  assert.equal(importQuiz(combineQuizSource(one, s))[0].answer, 1);
  assert.equal(importPractice(combineQuizSource(one, s))[0].answer, 1);
});
test("plots evaluate bounded arithmetic and reject executable text", () => {
  assert.equal(plotExpression("-0.05*\\x*\\x + 2*\\x")(20), 20);
  assert.equal(plotExpression("ln(\\x-1)/ln(2)")(3), 1);
  assert.equal(plotExpression("-x^2")(3), -9);
  for (const s of [
    "process.exit()",
    "constructor(x)",
    "x;alert(1)",
    "x ** 2",
    "(".repeat(50) + "x" + ")".repeat(50),
  ])
    assert.throws(() => plotExpression(s));
});
