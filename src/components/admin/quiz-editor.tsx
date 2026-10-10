"use client";
import { useState } from "react";
import {
  importQuiz,
  splitQuizSource,
  combineQuizSource,
  type QuizQuestion,
} from "@/lib/quiz/import";
import { QuizText } from "@/components/course/quiz-text";
import { saveHomeworkMode } from "@/app/(admin)/admin/courses/quiz-actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
const example = String.raw`\qnum{1} Сыбайлас бұрыштардың қосындысы?
A) $90^\circ$ \\
B) $180^\circ$ \\
C) $270^\circ$ \\
D) $360^\circ$
\section{Үй тапсырмасының жауаптары мен шығарылу жолдары}
\begin{enumerate}
\item \textbf{Жауабы: B.} Сыбайлас бұрыштар жазық бұрышты құрайды: $180^\circ$.
\end{enumerate}`;
export function QuizEditor({
  lessonId,
  initialMode,
  initialSource,
}: {
  lessonId: string;
  initialMode: string;
  initialSource: string;
}) {
  const initial = splitQuizSource(initialSource);
  const [mode, setMode] = useState(initialMode),
    [source, setSource] = useState(initial.questions),
    [solutions, setSolutions] = useState(initial.solutions),
    [previewIndex, setPreviewIndex] = useState(0),
    [preview, setPreview] = useState<QuizQuestion[]>([]),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const toast = useToast();
  function inspect() {
    try {
      setPreview(importQuiz(combineQuizSource(source, solutions)));
      setPreviewIndex(0);
      setError("");
    } catch (e) {
      setPreview([]);
      setError(e instanceof Error ? e.message : "Код дұрыс емес.");
    }
  }
  async function save() {
    setPending(true);
    setError("");
    try {
      const result = await saveHomeworkMode(
        lessonId,
        mode,
        combineQuizSource(source, solutions),
      );
      if (!result.ok) setError(result.message);
      toast({ message: result.message, error: !result.ok });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Қате орын алды. Қайта көріңіз.",
      );
    } finally {
      setPending(false);
    }
  }
  async function loadFile(
    file: File | undefined,
    target: "questions" | "solutions",
  ) {
    if (!file) return;
    try {
      if (!/\.(tex|txt)$/i.test(file.name) || file.size > 1000000)
        throw new Error("1 МБ-қа дейінгі .tex немесе .txt файлын таңдаңыз.");
      const text = await file.text();
      if (text.length > 250000)
        throw new Error("Код 250 000 таңбадан аспасын.");
      if (target === "solutions") setSolutions(text);
      else {
        const parts = splitQuizSource(text);
        setSource(parts.questions);
        if (parts.solutions) setSolutions(parts.solutions);
      }
      setPreview([]);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Файлды оқу мүмкін болмады.");
    }
  }
  const selected = preview[previewIndex];
  return (
    <section className="quiz-editor">
      <h2 className="text-xl font-semibold">Тапсырма түрі және тест</h2>
      <label className="mt-5 block">
        Үй тапсырмасын беру түрі
        <select
          className="premium-input mt-2 w-full"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={pending}
        >
          <option value="pdf">Тек PDF — тест шегі жоқ</option>
          <option value="quiz">Сайттағы тест — 80%-дан көп</option>
          <option value="both">PDF және тест — 80%-дан көп</option>
        </select>
      </label>
      <p className="my-4 text-sm text-muted">
        PDF файлын төменнен тіркеңіз. Тест немесе «екеуі бірге» таңдалса, оқушы
        келесі сабаққа өту үшін 80%-дан көп жинауы керек. Тест өзгерсе, бұрынғы
        нәтижелер жаңадан тапсыруды талап етеді.
      </p>
      <ol className="my-5 list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>Тапсырма түрін таңдаңыз: PDF, тест немесе екеуі бірге.</li>
        <li>
          Сұрақтар мен шешімдердің кодын төмендегі бөлек өрістерге қойыңыз
          немесе .tex / .txt файлдарын таңдаңыз.
        </li>
        <li>
          «Алдын ала қарау» арқылы сұрақтар мен сызбаларды тексеріп, сақтаңыз.
        </li>
      </ol>
      <details className="mb-4">
        <summary className="cursor-pointer text-brand">
          TeXstudio кодының үлгісі
        </summary>
        <pre className="overflow-auto p-3 text-xs">{example}</pre>
        <p className="text-xs text-muted">
          1–100 сұрақ. Әрқайсысында A–D жауаптары және жауаптар бөлімінде шешімі
          болсын. «Жауабы: B» шешімнің басында да, соңында да жазыла алады; нүкте міндетті емес. $...$ формулалары, қарапайым TikZ: coordinate, draw, path,
          node, кесінділер мен доғалар қолданылады. Толық TeX бағдарламасы
          орындалмайды.
        </p>
      </details>
      <label className="mb-3 block text-sm">
        Сұрақтар файлы (.tex / .txt)
        <input
          type="file"
          accept=".tex,.txt"
          disabled={pending}
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            void loadFile(e.target.files?.[0], "questions");
            e.target.value = "";
          }}
        />
      </label>
      <label className="block">
        Сұрақтардың TeX коды
        <textarea
          className="premium-input mt-2 min-h-64 w-full font-mono text-xs"
          value={source}
          maxLength={250000}
          onChange={(e) => {
            setSource(e.target.value);
            setPreview([]);
          }}
          disabled={pending}
          spellCheck={false}
        />
      </label>
      <p className="my-2 text-xs text-muted">
        Бір файлда сұрақтар да, жауаптар да болса, файлдан жүктегенде автоматты
        түрде бөлінеді. Толық кодты бірінші өріске де қоюға болады — екінші
        өрісті бос қалдырыңыз.
      </p>
      <label className="mb-3 mt-5 block text-sm">
        Шешімдер файлы (.tex / .txt)
        <input
          type="file"
          accept=".tex,.txt"
          disabled={pending}
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            void loadFile(e.target.files?.[0], "solutions");
            e.target.value = "";
          }}
        />
      </label>
      <label className="block">
        Жауаптар мен шешімдердің TeX коды
        <textarea
          className="premium-input mt-2 min-h-48 w-full font-mono text-xs"
          value={solutions}
          maxLength={250000}
          onChange={(e) => {
            setSolutions(e.target.value);
            setPreview([]);
          }}
          disabled={pending}
          spellCheck={false}
        />
      </label>
      {error && (
        <p role="alert" className="my-3 text-red-300">
          {error}
        </p>
      )}
      <div className="my-4 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={pending || !source.trim()}
          onClick={inspect}
        >
          Алдын ала қарау
        </Button>
        <Button disabled={pending} onClick={() => void save()}>
          {pending ? "Сақталуда..." : "Тапсырма түрін және тестті сақтау"}
        </Button>
      </div>
      {selected && (
        <div className="quiz-preview">
          <p className="mb-4" role="status">
            {preview.length} сұрақ · өту үшін кемінде{" "}
            {Math.floor(preview.length * 0.8) + 1} дұрыс жауап
          </p>
          <label className="mb-4 block text-sm">
            Қарайтын сұрақ
            <select
              className="premium-input ml-3"
              value={previewIndex}
              onChange={(e) => setPreviewIndex(Number(e.target.value))}
            >
              {preview.map((_, i) => (
                <option key={i} value={i}>
                  {i + 1}-сұрақ
                </option>
              ))}
            </select>
          </label>
          <QuizText text={selected.prompt} />
          <div className="quiz-options">
            {selected.options.map((o, j) => (
              <div
                className="flex items-start gap-3 rounded-xl border border-white/15 p-3"
                key={j}
              >
                <span>{"ABCD"[j]})</span>
                <QuizText text={o} />
              </div>
            ))}
          </div>
          <details className="quiz-solution">
            <summary>Дұрыс жауап пен шешім · {"ABCD"[selected.answer]}</summary>
            <QuizText text={selected.solution} />
          </details>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={previewIndex === 0}
              onClick={() => setPreviewIndex(previewIndex - 1)}
            >
              Алдыңғы сұрақ
            </Button>
            <Button
              variant="secondary"
              disabled={previewIndex === preview.length - 1}
              onClick={() => setPreviewIndex(previewIndex + 1)}
            >
              Келесі сұрақ
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
