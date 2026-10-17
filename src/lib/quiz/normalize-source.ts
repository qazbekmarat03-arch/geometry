/** Normalize common authoring wrappers; never expand macros or execute TeX. */
export function normalizeQuizSource(input: string): string {
  if (input.length > 250000) throw new Error("Код 250 000 таңбадан аспасын.");
  let text = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  text = text.replace(/^```(?:latex|tex)?\s*\n([\s\S]*?)\n```$/i, "$1");
  // Ignore a standalone document's preamble, including macro definitions.
  text = text
    .replace(/^[\s\S]*?\\begin\{document\}/, "")
    .replace(/\\end\{document\}\s*$/, "")
    .replace(/(?<!\\)%[^\n]*/g, "");
  text = text.replace(
    /\\begin\{(choices|oneparchoices|checkboxes|oneparcheckboxes)\}([\s\S]*?)\\end\{\1\}/g,
    (_, _env: string, body: string) => {
      let index = 0;
      return (
        body.replace(/\\(?:CorrectChoice|correctchoice|choice)\b/g, () => {
          if (index >= 6)
            throw new Error("Бір сұрақта ең көбі 6 жауап нұсқасы болсын.");
          return `\n${"ABCDEF"[index++]}) `;
        }) + "\n"
      );
    },
  );
  text = text.replace(/\\(?:begin|end)\{questions\}/g, "");
  // Cyrillic look-alikes and A. / (A) / A) labels become one format.
  return text.replace(
    /^[ \t]*(?:\(([A-FАВСДЕ])\)|([A-FАВСДЕ])[.)])[ \t]*/gm,
    (_, bracket: string, plain: string) => {
      const letter = bracket || plain;
      const latin =
        ({ А: "A", В: "B", С: "C", Д: "D", Е: "E" } as Record<string, string>)[
          letter
        ] || letter;
      return `${latin}) `;
    },
  );
}
