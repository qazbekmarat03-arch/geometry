"use client";
import { memo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { parseDiagram } from "@/lib/quiz/diagram";

// Text is escaped by React; only bounded, untrusted KaTeX output becomes HTML.
function MathText({ text }: { text: string }) {
  const parts = text.split(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+\$|\\begin\{(?:equation\*?|align\*?|gather\*?)\}[\s\S]*?\\end\{(?:equation\*?|align\*?|gather\*?)\})/g,
  );
  return (
    <>
      {parts.map((part, i) => {
        const display =
          part.startsWith("$$") ||
          part.startsWith("\\[") ||
          part.startsWith("\\begin{");
        const math =
          display ||
          part.startsWith("\\(") ||
          (part.startsWith("$") && part.endsWith("$"));
        if (math) {
          let formula = part.startsWith("\\begin{")
            ? part
                .replace(/\\begin\{align\*?\}/g, "\\begin{aligned}")
                .replace(/\\end\{align\*?\}/g, "\\end{aligned}")
                .replace(/\\(?:begin|end)\{(?:equation|gather)\*?\}/g, "")
            : part.slice(
                display || part.startsWith("\\(") ? 2 : 1,
                display || part.startsWith("\\(") ? -2 : -1,
              );
          formula = formula.replace(/\\label\{[^}]*\}/g, "");
          try {
            const html = katex.renderToString(formula, {
              displayMode: display,
              trust: false,
              throwOnError: true,
              strict: "ignore",
              maxExpand: 200,
              maxSize: 10,
            });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return (
              <span
                key={i}
                className="my-2 block rounded-lg border border-amber-500/40 p-3"
              >
                <span className="block text-sm">
                  Бұл формуланың TeX синтаксисін тексеріңіз:
                </span>
                <code className="break-all text-xs">{part}</code>
              </span>
            );
          }
        }
        return <Prose key={i} text={part} />;
      })}
    </>
  );
}
function Prose({ text }: { text: string }) {
  // No macros, file access, scripts or HTML execution.
  const cleaned = text
    .replace(/\\documentclass(?:\[[^\]]*\])?\{[^}]*\}/g, "")
    .replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/g, "")
    .replace(/\\(?:begin|end)\{(?:document|center|enumerate|itemize)\}/g, "\n")
    .replace(/\\(?:newpage|clearpage|noindent|maketitle)\b/g, "\n")
    .replace(/\\(?:vspace|hspace)\*?\{[^}]*\}/g, "")
    .replace(/\\(?:LARGE|Large|large|small|normalsize)\b/g, "")
    .replace(/\\item(?:\[[^\]]*\])?/g, "\n• ")
    .replace(/\\\\(?:\[[^\]]*\])?/g, "\n");
  return (
    <>
      {cleaned
        .split(
          /(\\(?:section|subsection|subsubsection)\*?\{[^{}]*\}|\\(?:textbf|textit|emph)\{[^{}]*\})/g,
        )
        .map((part, i) => {
          const match = part.match(
            /^\\(section|subsection|subsubsection|textbf|textit|emph)\*?\{([^{}]*)\}$/,
          );
          if (match) {
            if (match[1].includes("section"))
              return (
                <strong key={i} className="mb-3 mt-7 block text-xl">
                  {match[2]}
                </strong>
              );
            return match[1] === "textbf" ? (
              <strong key={i}>{match[2]}</strong>
            ) : (
              <em key={i}>{match[2]}</em>
            );
          }
          if (/\\[a-zA-Z]+/.test(part))
            return (
              <span key={i} className="block rounded-lg border border-line p-3">
                <span className="block text-xs text-muted">
                  Бұл TeX бөлігіне толық қолдау жоқ; бастапқы код сақталды.
                </span>
                <code className="whitespace-pre-wrap break-words text-sm">
                  {part}
                </code>
              </span>
            );
          return <span key={i}>{part.replace(/\\([%&_#{}])/g, "$1")}</span>;
        })}
    </>
  );
}
export const QuizText = memo(function QuizText({ text }: { text: string }) {
  return (
    <div className="quiz-text">
      {text
        .replace(/^[\s\S]*?\\begin\{document\}/, "")
        .replace(/\\end\{document\}[\s\S]*$/, "")
        .split(/(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g)
        .map((part, i) => {
          if (!part.startsWith("\\begin{tikzpicture}"))
            return <MathText key={i} text={part} />;
          try {
            const d = parseDiagram(part);
            return (
              <figure className="quiz-diagram" key={i}>
                <svg
                  viewBox={d.viewBox}
                  role="img"
                  aria-label="Есептің геометриялық сызбасы"
                >
                  {d.paths.map((p, j) => (
                    <path
                      key={j}
                      d={p.d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={p.thick ? 2 : 1.2}
                      strokeDasharray={p.dashed ? "6 4" : undefined}
                    />
                  ))}
                  {d.dots.map((p, j) => (
                    <circle
                      key={j}
                      cx={p[0] * 50}
                      cy={-p[1] * 50}
                      r="3"
                      fill="currentColor"
                    />
                  ))}
                  {d.labels.map((l, j) => (
                    <foreignObject
                      key={j}
                      x={l.at[0] * 50 - 65}
                      y={-l.at[1] * 50 - 13}
                      width="130"
                      height="36"
                    >
                      <div className="quiz-diagram-label">
                        <MathText text={l.text} />
                      </div>
                    </foreignObject>
                  ))}
                </svg>
                <figcaption>Сызба масштабпен берілмеген.</figcaption>
              </figure>
            );
          } catch {
            return (
              <p key={i} role="alert">
                Сызбаны көрсету мүмкін болмады. Мұғалімге хабарласыңыз.
              </p>
            );
          }
        })}
    </div>
  );
});
