"use client";
import { useState } from "react";
import type { PracticeView } from "@/lib/practice";
import { submitPractice } from "@/app/practice/actions";
import { QuizText } from "./quiz-text";
import { Button } from "@/components/ui/button";
export function PracticeRunner({
  id,
  initial,
}: {
  id: string;
  initial: PracticeView;
}) {
  const [view, setView] = useState(initial),
    [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<(number | null)[]>(
      initial.answers ?? initial.questions.map(() => null),
    ),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState(initial.score !== null);
  const q = view.questions[index],
    count = answers.filter((a) => a !== null).length;
  async function submit() {
    if (count !== view.questions.length) {
      setError("Барлық сұраққа жауап беріңіз.");
      setIndex(answers.findIndex((a) => a === null));
      return;
    }
    if (!window.confirm("Нұсқаны аяқтап, нәтижені көру керек пе?")) return;
    setPending(true);
    setError("");
    try {
      const r = await submitPractice(id, view.version, answers as number[]);
      if (r.error) setError(r.error);
      else if (r.data) {
        setView(r.data);
        setReview(true);
        setIndex(0);
      }
    } catch {
      setError("Қате орын алды. Қайта көріңіз.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="quiz-homework">
      <div role="status" className="quiz-score">
        {review
          ? `${view.score} / ${view.questions.length} дұрыс · ${Math.round(((view.score ?? 0) / view.questions.length) * 100)}%`
          : `${count} / ${view.questions.length} жауап берілді`}
      </div>
      <p className="my-4 text-sm text-muted">
        {review
          ? "Нәтиже және толық талдау. Әр дұрыс жауап — 1 ұпай."
          : "Әр сұрақта бір дұрыс жауап бар. Нәтиже мен талдау аяқтағаннан кейін ашылады."}
      </p>
      <label className="block mb-5">
        Сұрақ
        <select
          className="premium-input ml-3"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {view.questions.map((v, i) => (
            <option key={v.id} value={i}>
              {i + 1}-сұрақ{answers[i] !== null ? " · жауап бар" : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-3xl border border-line p-5">
        <QuizText text={q.prompt} />
        <fieldset className="my-5 space-y-3" disabled={review || pending}>
          <legend className="sr-only">Жауапты таңдаңыз</legend>
          {q.options.map((o, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4"
            >
              <input
                type="radio"
                name={`question-${index}`}
                checked={answers[index] === i}
                onChange={() =>
                  setAnswers((a) => a.map((v, j) => (j === index ? i : v)))
                }
              />
              <span>{"ABCD"[i]})</span>
              <QuizText text={o} />
            </label>
          ))}
        </fieldset>
        {review && (
          <div className="rounded-2xl border border-brand p-5">
            <p className="mb-3 font-semibold">
              {answers[index] === q.answer ? "Дұрыс жауап" : "Қате жауап"} ·
              Дұрыс нұсқа: {"ABCD"[q.answer ?? 0]}
            </p>
            <QuizText text={q.solution ?? ""} />
          </div>
        )}
      </div>
      <div className="my-6 flex flex-wrap gap-3">
        <Button disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Алдыңғы
        </Button>
        <Button
          disabled={index === view.questions.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          {answers[index] === null ? "Өткізіп жіберу" : "Келесі"} →
        </Button>
        {!review && (
          <Button disabled={pending} onClick={submit}>
            {pending ? "Сақталуда..." : "Нұсқаны аяқтау"}
          </Button>
        )}
        {review && (
          <Button
            onClick={() => {
              setReview(false);
              setAnswers(view.questions.map(() => null));
              setIndex(0);
            }}
          >
            Қайта тапсыру
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
