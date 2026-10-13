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
    [answers, setAnswers] = useState<(number | number[] | null)[]>(
      initial.answers ?? initial.questions.map(() => null),
    ),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState(initial.score !== null);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const complete = (a: number | number[] | null, i: number) =>
    a !== null &&
    (!Array.isArray(a) ||
      (a.length > 0 &&
        a.every((n) => n >= 0) &&
        (view.questions[i].kind !== "matching" ||
          a.length === view.questions[i].rows?.length)));
  const correct = (i: number) =>
    JSON.stringify(answers[i]) === JSON.stringify(view.questions[i].answer);
  const visible = view.questions
    .map((_, i) => i)
    .filter((i) => !review || !onlyWrong || !correct(i));
  const q = view.questions[index],
    count = answers.filter(complete).length;
  const update = (value: number | number[]) =>
    setAnswers((a) => a.map((v, i) => (i === index ? value : v)));
  const position = visible.indexOf(index);
  const answerLabel = (value: number | number[] | null) =>
    Array.isArray(value)
      ? value
          .map(
            (v, i) =>
              `${q.kind === "matching" ? `${i + 1}-` : ""}${"ABCDEF"[v] ?? "—"}`,
          )
          .join(", ")
      : value === null
        ? "—"
        : "ABCDEF"[value];
  async function submit() {
    if (count !== view.questions.length) {
      setError("Барлық сұраққа жауап беріңіз.");
      setIndex(answers.findIndex((a, i) => !complete(a, i)));
      return;
    }
    if (!window.confirm("Нұсқаны аяқтап, нәтижені көру керек пе?")) return;
    setPending(true);
    setError("");
    try {
      const r = await submitPractice(
        id,
        view.version,
        answers as (number | number[])[],
      );
      if (r.error) setError(r.error);
      else if (r.data) {
        setView(r.data);
        setReview(true);
        setOnlyWrong(false);
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
          : "Бір жауап, бірнеше жауап және сәйкестендіру тапсырмалары болуы мүмкін. Нәтиже мен талдау аяқтағаннан кейін ашылады."}
      </p>
      {review && (
        <Button
          variant="secondary"
          className="mb-4"
          disabled={answers.every((_, i) => correct(i))}
          onClick={() => {
            const next = !onlyWrong;
            setOnlyWrong(next);
            setIndex(next ? answers.findIndex((_, i) => !correct(i)) : 0);
          }}
        >
          {onlyWrong ? "Барлық сұрақтар" : "Қате есептерді талдау"}
        </Button>
      )}
      <label className="block mb-5">
        Сұрақ
        <select
          className="premium-input ml-3"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {visible.map((i) => (
            <option key={i} value={i}>
              {i + 1}-сұрақ
              {review
                ? correct(i)
                  ? " · дұрыс"
                  : " · қате"
                : complete(answers[i], i)
                  ? " · жауап бар"
                  : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-3xl border border-line p-5">
        <QuizText text={q.prompt} />
        <p className="mt-3 text-sm text-muted">
          {q.kind === "matching"
            ? "Әр жолға сәйкес жауапты таңдаңыз."
            : q.kind === "multiple"
              ? "Бір немесе бірнеше дұрыс жауапты белгілеңіз."
              : "Бір дұрыс жауапты таңдаңыз."}
        </p>
        {q.kind === "matching" &&
          q.rows?.map((row, r) => (
            <label
              key={r}
              className="my-4 block rounded-xl border border-line p-3"
            >
              <span>{r + 1})</span>
              <QuizText text={row} />
              <select
                aria-label={`${r + 1}-жолдың жауабы`}
                className="premium-input mt-2"
                disabled={review || pending}
                value={
                  Array.isArray(answers[index])
                    ? ((answers[index] as number[])[r] ?? -1)
                    : -1
                }
                onChange={(e) => {
                  const values = Array.isArray(answers[index])
                    ? [...(answers[index] as number[])]
                    : q.rows!.map(() => -1);
                  values[r] = Number(e.target.value);
                  update(values);
                }}
              >
                <option value={-1}>Таңдаңыз</option>
                {q.options.map((_, i) => (
                  <option key={i} value={i}>
                    {"ABCDEF"[i]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        <fieldset className="my-5 space-y-3" disabled={review || pending}>
          <legend className="sr-only">Жауапты таңдаңыз</legend>
          {q.options.map((o, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4"
            >
              {q.kind !== "matching" && (
                <input
                  type={q.kind === "multiple" ? "checkbox" : "radio"}
                  name={`question-${index}`}
                  checked={
                    Array.isArray(answers[index])
                      ? (answers[index] as number[]).includes(i)
                      : answers[index] === i
                  }
                  onChange={() => {
                    if (q.kind === "multiple") {
                      const values = Array.isArray(answers[index])
                        ? (answers[index] as number[])
                        : [];
                      update(
                        values.includes(i)
                          ? values.filter((v) => v !== i)
                          : [...values, i].sort((a, b) => a - b),
                      );
                    } else update(i);
                  }}
                />
              )}
              <span>{"ABCDEF"[i]})</span>
              <QuizText text={o} />
            </label>
          ))}
        </fieldset>
        {review && (
          <div className="rounded-2xl border border-brand p-5">
            <p className="mb-3 font-semibold">
              {correct(index) ? "Дұрыс жауап" : "Қате жауап"} · Дұрыс нұсқа:{" "}
              {answerLabel(q.answer)}
            </p>
            <QuizText text={q.solution ?? ""} />
          </div>
        )}
      </div>
      <div className="my-6 flex flex-wrap gap-3">
        <Button
          disabled={position <= 0}
          onClick={() => setIndex(visible[position - 1])}
        >
          ← Алдыңғы
        </Button>
        <Button
          disabled={position === visible.length - 1}
          onClick={() => setIndex(visible[position + 1])}
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
              setOnlyWrong(false);
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
