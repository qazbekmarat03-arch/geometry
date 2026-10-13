import { cleanTex, splitQuizSource } from "./import.ts";
import { parseDiagram } from "./diagram.ts";

export type PracticeQuestion = {
  prompt: string;
  options: string[];
  kind: "single" | "multiple" | "matching";
  rows: string[];
  answer: number | number[];
  solution: string;
};
type Draft = Omit<PracticeQuestion, "answer" | "solution">;

// Balanced TeX groups are data, never executable macros.
function group(text: string, start: number) {
  if (text[start] !== "{") throw new Error("TeX жақшасы ашылмаған.");
  let depth = 1,
    end = start + 1;
  for (; end < text.length && depth; end++) {
    if (text[end - 1] === "\\") continue;
    if (text[end] === "{") depth++;
    if (text[end] === "}") depth--;
  }
  if (depth) throw new Error("TeX жақшасы жабылмаған.");
  return { value: text.slice(start + 1, end - 1), end };
}
function tidy(text: string) {
  return cleanTex(
    text
      .replace(/\\setcounter\{qnumber\}\{\d+\}/g, "")
      .replace(/\\renewcommand\{\\arraystretch\}\{[^}]*\}/g, "")
      .replace(
        /\\(?:begin|end)\{(?:questions|choices|oneparchoices|solution)\}/g,
        "",
      )
      .replace(/\\newline\b/g, "\n"),
  );
}
function parts(text: string) {
  const explicit = /\\qnum\{\d+\}/.test(text);
  const markers = [
    ...text.matchAll(
      explicit ? /\\qnum\{(\d+)\}/g : /\\question\b(?:\s*\[\d+\])?/g,
    ),
  ];
  return markers.map((m, i) => {
    if (explicit && Number(m[1]) !== i + 1)
      throw new Error("Сұрақтар 1-ден бастап ретімен нөмірленуі керек.");
    return text.slice(
      m.index! + m[0].length,
      markers[i + 1]?.index ?? text.length,
    );
  });
}
export function parsePracticeQuestions(source: string): Draft[] {
  if (!source.trim() || source.length > 250000)
    throw new Error("Код бос немесе 250 000 таңбадан көп.");
  let text = splitQuizSource(source).questions.replace(/(?<!\\)%[^\n]*/g, "");
  const contexts: { from: number; to: number; text: string }[] = [];
  // A shared passage explicitly identifies the question range in its instruction.
  text = text.replace(
    /\\begin\{center\}\s*\\textbf\{\\Large\s+МӘТІН:[\s\S]*?\\setcounter\{qnumber\}\{\d+\}/g,
    (block) => {
      const range = block.match(/(\d+)\s*[-–]\s*(\d+)\s+тапсырма/);
      if (!range)
        throw new Error(
          "Ортақ мәтінге сұрақтар аралығын жазыңыз: 26–30 тапсырмалар.",
        );
      contexts.push({ from: +range[1], to: +range[2], text: tidy(block) });
      return "";
    },
  );
  const chunks = parts(text);
  if (!chunks.length || chunks.length > 100)
    throw new Error(
      "1–100 сұрақ қажет. \\question немесе \\qnum{1} қолданыңыз.",
    );
  return chunks.map((raw, index) => {
    // Section instructions belong to the next block, not to the last answer.
    let body = raw.split(/\\setcounter\{qnumber\}/)[0];
    let rows: string[] = [],
      optionText = "",
      prompt = "";
    if (body.includes("\\begin{tabular}")) {
      const start = body.indexOf("\\begin{tabular}");
      const spec = group(body, start + "\\begin{tabular}".length);
      let table = body.slice(
        spec.end,
        body.indexOf("\\end{tabular}", spec.end),
      );
      const multi = /\\multirow\s*/.exec(table);
      if (!multi)
        throw new Error(
          `${index + 1}: сәйкестендіру кестесінде multirow жауаптар блогы қажет.`,
        );
      let cursor = multi.index + multi[0].length;
      for (let n = 0; n < 3; n++) {
        while (/\s/.test(table[cursor] ?? "") && cursor < table.length)
          cursor++;
        const g = group(table, cursor);
        cursor = g.end;
        if (n === 2) optionText = g.value;
      }
      table = table.slice(0, multi.index) + table.slice(cursor);
      table = table
        .replace(/\\(?:hline|cline\{[^}]*\})/g, "")
        .replace(/&/g, "");
      rows = [
        ...table.matchAll(/(?:^|\n)\s*\d+\)\s*([\s\S]*?)(?=\\\\|$)/g),
      ].map((m) => tidy(m[1]));
      if (rows.length < 2 || rows.length > 6 || rows.some((r) => !r))
        throw new Error(`${index + 1}: кестеде 2–6 нөмірленген жол қажет.`);
      prompt = tidy(body.slice(0, start));
    } else {
      // Common exam-class choices as well as A) labels.
      let choice = 0;
      body = body.replace(
        /\\(?:CorrectChoice|choice)\b/g,
        () => `\n${"ABCDEF"[choice++]})`,
      );
      const first = body.search(/(?:^|\n)\s*A[).]\s/);
      if (first < 0)
        throw new Error(
          `${index + 1}: A–D немесе A–F жауап нұсқаларын енгізіңіз.`,
        );
      prompt = tidy(body.slice(0, first));
      optionText = body.slice(first);
    }
    optionText = optionText.replace(/\\newline\b/g, "\n");
    const labels = [...optionText.matchAll(/(?:^|\n)\s*([A-F])[).]\s*/g)];
    if (
      ![4, 6].includes(labels.length) ||
      labels.map((m) => m[1]).join("") !== "ABCDEF".slice(0, labels.length)
    )
      throw new Error(`${index + 1}: ретімен A–D немесе A–F жауаптары қажет.`);
    const options = labels.map((m, i) =>
      tidy(
        optionText.slice(
          m.index! + m[0].length,
          labels[i + 1]?.index ?? optionText.length,
        ),
      ),
    );
    const context = contexts.find(
      (c) => index + 1 >= c.from && index + 1 <= c.to,
    );
    if (context) prompt = `${context.text}\n\n${prompt}`;
    if (!prompt || options.some((o) => !o))
      throw new Error(`${index + 1}: сұрақ немесе жауап бос.`);
    for (const field of [prompt, ...rows, ...options])
      for (const diagram of field.matchAll(
        /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
      ))
        try {
          parseDiagram(diagram[0]);
        } catch (e) {
          throw new Error(
            `${index + 1}-сұрақ: ${e instanceof Error ? e.message : "Сызба қатесі"}`,
          );
        }
    return {
      prompt,
      options,
      rows,
      kind: rows.length
        ? "matching"
        : options.length === 6
          ? "multiple"
          : "single",
    };
  });
}
export function practiceSolutionTemplate(source: string) {
  return parsePracticeQuestions(source)
    .map(
      (q, i) =>
        `\\qnum{${i + 1}}\nЖауабы: ${q.kind === "matching" ? "1-?, 2-?" : "?"}\nШешімі: ...`,
    )
    .join("\n\n");
}
export function importPractice(source: string): PracticeQuestion[] {
  const draft = parsePracticeQuestions(source);
  const { solutions } = splitQuizSource(source);
  if (!solutions)
    throw new Error(
      "«Жауаптар мен шешімдердің TeX коды» өрісін толтырыңыз. «Шешімдер үлгісін жасау» батырмасын қолдануға болады.",
    );
  const numbered = parts(solutions);
  const items = numbered.length
    ? numbered
    : solutions.split(/\\item(?:\s*\[[^\]]*\])?\s*/).slice(1);
  if (items.length !== draft.length)
    throw new Error(
      `${draft.length} сұраққа ${draft.length} шешім қажет; қазір ${items.length} шешім бар.`,
    );
  return draft.map((q, i) => {
    const normalized = items[i].replace(/\\textbf\{([^{}]*)\}/g, "$1");
    const keys = [
      ...normalized.matchAll(
        /(?:Жауабы|Жауаптары|Дұрыс жауап(?:тар)?|Answer)\s*:\s*([^\n.$\\]+)/gi,
      ),
    ];
    if (keys.length !== 1)
      throw new Error(`${i + 1}: бір «Жауабы: ...» жолы қажет.`);
    const key = keys[0],
      rawKey = key[1]
        .trim()
        .replace(/[АВСД]/g, (c) => ({ А: "A", В: "B", С: "C", Д: "D" })[c]!);
    const letter = (s: string) => "ABCDEF".indexOf(s.toUpperCase());
    let answer: number | number[];
    if (q.kind === "matching") {
      const pairs = rawKey
        .split(/\s*[,;]\s*/)
        .map((s) => /^(\d+)\s*[-–:=]\s*([A-F])$/i.exec(s));
      if (
        pairs.length !== q.rows.length ||
        pairs.some((p, n) => !p || +p[1] !== n + 1)
      )
        throw new Error(
          `${i + 1}: сәйкестендіру жауабын «1-B, 2-C» түрінде жазыңыз.`,
        );
      answer = pairs.map((p) => letter(p![2]));
    } else {
      if (!/^[A-F](?:\s*[,;]\s*[A-F])*$/i.test(rawKey))
        throw new Error(
          `${i + 1}: жауапты «B» немесе «A, C, E» түрінде жеке жолға жазыңыз.`,
        );
      const values = rawKey.split(/\s*[,;]\s*/).map(letter);
      if (
        new Set(values).size !== values.length ||
        (q.kind === "single" && values.length !== 1)
      )
        throw new Error(`${i + 1}: жауап кілті тапсырма түріне сәйкес емес.`);
      answer = q.kind === "single" ? values[0] : values.sort((a, b) => a - b);
    }
    if (
      (Array.isArray(answer) ? answer : [answer]).some(
        (n) => n < 0 || n >= q.options.length,
      )
    )
      throw new Error(`${i + 1}: жауапта жоқ нұсқа таңдалған.`);
    const solution = tidy(
      normalized.slice(0, key.index) +
        normalized.slice(key.index! + key[0].length),
    )
      .replace(/^\s*\.?\s*(?:Шешімі\s*:\s*)?/, "")
      .trim();
    if (!solution || solution === "...")
      throw new Error(`${i + 1}: толық шешу жолын енгізіңіз.`);
    for (const d of solution.matchAll(
      /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
    ))
      parseDiagram(d[0]);
    return { ...q, answer, solution };
  });
}
