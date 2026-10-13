export type PracticeView = {
  version: number;
  score: number | null;
  answers: (number | number[])[] | null;
  submittedAt: string | null;
  questions: {
    id: number;
    prompt: string;
    options: string[];
    kind?: "single" | "multiple" | "matching";
    rows?: string[];
    answer: number | number[] | null;
    solution: string | null;
  }[];
};
export const PRACTICE_WHATSAPP =
  "https://wa.me/77755851203?text=" +
  encodeURIComponent(
    "Сәлеметсіз бе! 500 ₸ тұратын ҰБТ математика нұсқасын талдауымен алғым келеді.",
  );
