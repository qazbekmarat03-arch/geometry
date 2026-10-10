"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/app/(student)/dashboard/courses/quiz-actions";
import type { QuizView } from "@/lib/quiz/import";
import { QuizText } from "./quiz-text";
import { Button } from "@/components/ui/button";
export function LessonQuiz({
  lessonId,
  initial,
}: {
  lessonId: string;
  initial: QuizView;
}) {
  const [quiz, setQuiz] = useState(initial),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [index, setIndex] = useState(0);
  const router = useRouter();
  const remaining = quiz.questions.filter((q) => !q.correct);
  const current = remaining[index];
  const unanswered = remaining.findIndex((q) => answers[q.id] === undefined);
  function skip() {
    const next = remaining.findIndex(
      (q, i) => i > index && answers[q.id] === undefined,
    );
    const earlier = remaining.findIndex(
      (q, i) => i < index && answers[q.id] === undefined,
    );
    setIndex(
      next >= 0
        ? next
        : earlier >= 0
          ? earlier
          : (index + 1) % remaining.length,
    );
  }
  async function submit() {
    if (unanswered >= 0) {
      setIndex(unanswered);
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await submitQuiz(
        lessonId,
        quiz.version,
        quiz.round,
        answers,
      );
      if (result.error) setError(result.error);
      else if (result.data) {
        setQuiz(result.data);
        setAnswers({});
        setIndex(0);
        router.refresh();
      }
    } catch {
      setError("Қате орын алды. Қайта көріңіз.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="quiz-homework" aria-label="Үй тапсырмасы — тест">
      <p className="eyebrow text-brand">БІЛІМІҢДІ БЕКІТ</p>
      <h3 className="my-3 text-2xl">Үй тапсырмасы · тест</h3>
      <p className="text-sm text-muted">
        Келесі сабаққа өту үшін 80%-дан көп: кемінде{" "}
        {Math.floor(quiz.total * 0.8) + 1} / {quiz.total} дұрыс жауап. Дұрыс
        жауаптарың сақталады.
      </p>
      <div role="status" className="quiz-score">
        {quiz.correctCount} / {quiz.total} дұрыс ·{" "}
        {Math.round((quiz.correctCount / quiz.total) * 100)}%
        {quiz.passed
          ? " — Тесттен өттің! Сабақ аяқталды."
          : quiz.round
            ? ` — ${remaining.length} сұрақты қайта орында.`
            : ""}
      </div>
      {current && (
        <div>
          <div
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted"
            aria-live="polite"
          >
            <span>
              Сұрақ {index + 1} / {remaining.length}
            </span>
            <span>
              Жауап берілгені: {Object.keys(answers).length} /{" "}
              {remaining.length}
            </span>
          </div>
          <progress
            className="mt-3 h-2 w-full accent-emerald-400"
            value={Object.keys(answers).length}
            max={remaining.length}
            aria-label="Жауап берілген сұрақтар"
          />
          {[current].map((q) => (
            <fieldset
              className="quiz-question"
              key={`${quiz.round}-${q.id}`}
              disabled={pending}
            >
              <legend>{q.id + 1}-сұрақ</legend>
              <QuizText text={q.prompt} />
              <div className="quiz-options">
                {q.options.map((option, i) => (
                  <label key={i}>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={i}
                      checked={answers[q.id] === i}
                      onChange={() =>
                        setAnswers((previous) => ({ ...previous, [q.id]: i }))
                      }
                    />
                    <span>{"ABCD"[i]}</span>
                    <QuizText text={option} />
                  </label>
                ))}
              </div>
              {q.solution && (
                <details className="quiz-solution" open>
                  <summary>Екі әрекеттен кейінгі шығарылу жолы</summary>
                  <QuizText text={q.solution} />
                  <p>
                    Дұрыс жауап: {"ABCD"[q.answer!]}. Шешімін түсініп, жауабыңды
                    қайта белгіле.
                  </p>
                </details>
              )}
            </fieldset>
          ))}
          {error && (
            <p role="alert" className="my-4 text-red-300">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              type="button"
              disabled={pending || index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Артқа
            </Button>
            {answers[current.id] === undefined && (
              <Button
                variant="ghost"
                type="button"
                disabled={pending || remaining.length === 1}
                onClick={skip}
              >
                Өткізіп жіберу
              </Button>
            )}
            {index < remaining.length - 1 && (
              <Button
                type="button"
                disabled={pending}
                onClick={() => setIndex(index + 1)}
              >
                Келесі
              </Button>
            )}
            {index === remaining.length - 1 &&
              unanswered >= 0 &&
              unanswered !== index && (
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => setIndex(unanswered)}
                >
                  Қалған сұрақтарға оралу
                </Button>
              )}
            {unanswered < 0 && (
              <Button
                disabled={pending}
                type="button"
                onClick={() => void submit()}
              >
                {pending
                  ? "Тексерілуде..."
                  : quiz.round
                    ? "Қате сұрақтарды қайта тапсыру"
                    : "Жауаптарды тексеру"}
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            Таңдалғаны: {Object.keys(answers).length} / {remaining.length}.
            Өткізілген сұрақтарға соңында оралыңыз. Тексеру үшін барлық сұраққа
            жауап беріңіз.
          </p>
        </div>
      )}
    </section>
  );
}
