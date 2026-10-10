import { parseDiagram } from "./diagram.ts";
export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  solution: string;
};
export type QuizView = {
  mode: "pdf" | "quiz" | "both";
  version: number;
  round: number;
  passed: boolean;
  total: number;
  correctCount: number;
  questions: {
    id: number;
    prompt: string;
    options: string[];
    correct: boolean;
    solution: string | null;
    answer: number | null;
  }[];
};

const solutionsHeading =
  /\\section\*?\{[^}]*(?:жауап(?:тары| кілті)?|шешімдері|шешу жолдары|шығарылу жолдары)[^}]*\}/i;
export function splitQuizSource(source: string) {
  const boundary = source.search(solutionsHeading);
  return boundary < 0
    ? { questions: source, solutions: "" }
    : {
        questions: source.slice(0, boundary).trim(),
        solutions: source.slice(boundary).trim(),
      };
}
export function combineQuizSource(questions: string, solutions: string) {
  if (!solutions.trim()) return questions;
  if (questions.search(solutionsHeading) >= 0)
    throw new Error(
      "Жауаптар екі рет берілген. Бірінші өрісте тек сұрақтарды қалдырыңыз.",
    );
  const heading =
    solutions.search(solutionsHeading) >= 0
      ? ""
      : "\\section*{Үй тапсырмасының толық шешу жолдары}\n";
  return `${questions.trim()}\n${heading}${solutions.trim()}`;
}

export function cleanTex(text: string) {
  return text
    .replace(/(?<!\\)%[^\n]*/g, "")
    .replace(/\\(?:vspace|hspace)\*?\{[^}]*\}/g, "")
    .replace(/\\(?:newpage|clearpage)/g, "")
    .replace(/\\(?:subsection|section)\*?\{[^}]*\}/g, "")
    .replace(/\\(?:begin|end)\{(?:center|enumerate|document)\}/g, "")
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\\\/g, "\n")
    .trim();
}

/** Parse a bounded, declarative question format. Never execute TeX commands. */
export function importQuiz(source: string): QuizQuestion[] {
  if (!source.trim() || source.length > 250000)
    throw new Error("Код бос немесе тым үлкен (250 000 таңбаға дейін).");
  const boundary = source.search(solutionsHeading);
  if (boundary < 0)
    throw new Error(
      "Жауаптар бөлімі қажет: \\section{Үй тапсырмасының жауаптары мен шығарылу жолдары}",
    );
  const chunks = source.slice(0, boundary).split(/\\qnum\{(\d+)\}/);
  const solutionItems = source
    .slice(boundary)
    .split(/\\item(?:\s*\[[^\]]*\])?\s*/)
    .slice(1);
  const solutions = solutionItems.map((item, index) => {
    const body = item.split(/\\end\{enumerate\}/)[0];
    const normalized = body.replace(/\\textbf\{([^{}]*)\}/g, "$1");
    const keys = [
      ...normalized.matchAll(
        /Жауабы\s*:\s*([ABCDАВСД])(?:\s*[.)])?(?![A-Za-zА-Яа-я])/gu,
      ),
    ];
    if (keys.length !== 1)
      throw new Error(
        `${index + 1}-сұрақта бір ғана «Жауабы: A/B/C/D» белгісі болуы керек (шешімнің басында немесе соңында).`,
      );
    const key = keys[0];
    const letter =
      ({ А: "A", В: "B", С: "C", Д: "D" } as Record<string, string>)[key[1]] ??
      key[1];
    const solution = cleanTex(
      normalized.slice(0, key.index) +
        normalized.slice(key.index! + key[0].length),
    );
    if (!solution)
      throw new Error(`${index + 1}-сұрақтың шығарылу жолын енгізіңіз.`);
    return { letter, solution };
  });
  const questions: QuizQuestion[] = [];
  for (let i = 1; i < chunks.length; i += 2) {
    if (Number(chunks[i]) !== questions.length + 1)
      throw new Error("Сұрақтар 1-ден бастап ретімен нөмірленуі керек.");
    const body = chunks[i + 1];
    // Match each option to the next label rather than a line ending.
    const labels = [...body.matchAll(/^\s*([ABCD])\)/gm)];
    if (labels.length !== 4 || labels.map((x) => x[1]).join("") !== "ABCD")
      throw new Error(
        `${chunks[i]}-сұрақта A), B), C), D) жауаптары болуы керек.`,
      );
    const answer = solutions[questions.length];
    if (!answer)
      throw new Error(`${chunks[i]}-сұрақтың жауабы немесе шешімі жоқ.`);
    const prompt = cleanTex(body.slice(0, labels[0].index));
    const values = labels.map((label, j) =>
      cleanTex(
        body.slice(
          label.index! + label[0].length,
          labels[j + 1]?.index ?? body.length,
        ),
      ),
    );
    const solution = answer.solution;
    if (!prompt || values.some((x) => !x) || !solution)
      throw new Error("Сұрақ, жауап нұсқалары мен шешімі бос болмауы керек.");
    for (const diagram of prompt.matchAll(
      /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
    ))
      parseDiagram(diagram[0]);
    questions.push({
      prompt,
      options: values,
      answer: "ABCD".indexOf(answer.letter),
      solution,
    });
  }
  if (
    !questions.length ||
    questions.length > 100 ||
    solutions.length !== questions.length
  )
    throw new Error("1–100 сұрақ және әр сұраққа бір жауап пен шешім қажет.");
  return questions;
}
