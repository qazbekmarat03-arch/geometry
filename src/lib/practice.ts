export type PracticeView = {
  version: number;
  score: number | null;
  answers: number[] | null;
  submittedAt: string | null;
  questions: {
    id: number;
    prompt: string;
    options: string[];
    answer: number | null;
    solution: string | null;
  }[];
};
export const PRACTICE_WHATSAPP =
  "https://wa.me/77755851203?text=" +
  encodeURIComponent(
    "Сәлеметсіз бе! 500 ₸ тұратын ҰБТ математика нұсқасын талдауымен алғым келеді.",
  );
