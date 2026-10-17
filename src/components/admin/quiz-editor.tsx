"use client";
import { useEffect, useMemo, useState } from "react";
import {
  importQuiz,
  splitQuizSource,
  combineQuizSource,
  type QuizQuestion,
} from "@/lib/quiz/import";
import {
  importPractice,
  parsePracticeQuestions,
  practiceSolutionTemplate,
  type PracticeQuestion,
} from "@/lib/quiz/practice-import";
import { MatchingTable } from "@/components/course/matching-table";
import dynamic from "next/dynamic";
const QuizText = dynamic(
  () => import("@/components/course/quiz-text").then((m) => m.QuizText),
  { loading: () => <span>Формула жүктелуде...</span> },
);
import { saveHomeworkMode } from "@/app/(admin)/admin/courses/quiz-actions";
import { savePracticeQuiz } from "@/app/(admin)/admin/practice/actions";
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
  practice = false,
}: {
  lessonId: string;
  initialMode: string;
  initialSource: string;
  practice?: boolean;
}) {
  const initial = useMemo(
    () => splitQuizSource(initialSource),
    [initialSource],
  );
  const [mode, setMode] = useState(initialMode),
    [source, setSource] = useState(initial.questions),
    [solutions, setSolutions] = useState(initial.solutions),
    [previewIndex, setPreviewIndex] = useState(0),
    [preview, setPreview] = useState<(QuizQuestion | PracticeQuestion)[]>([]),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const toast = useToast();
  const [showPdfCode, setShowPdfCode] = useState(false);
  const signature = JSON.stringify([mode, source, solutions]);
  const [savedSignature, setSavedSignature] = useState(signature);
  const dirty = signature !== savedSignature;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function inspect() {
    try {
      const combined = combineQuizSource(source, solutions);
      if (splitQuizSource(combined).solutions) {
        setPreview(practice ? importPractice(combined) : importQuiz(combined));
      } else {
        const questions = parsePracticeQuestions(combined);
        if (
          !practice &&
          questions.some((q) => q.kind !== "single" || q.options.length !== 4)
        )
          throw new Error(
            "Үй тапсырмасында төрт нұсқалы, бір дұрыс жауапты сұрақтар болсын.",
          );
        setPreview(questions.map((q) => ({ ...q, answer: -1, solution: "" })));
      }
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
      const result = await (practice ? savePracticeQuiz : saveHomeworkMode)(
        lessonId,
        mode,
        combineQuizSource(source, solutions),
      );
      if (!result.ok) setError(result.message);
      else setSavedSignature(signature);
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
      <h2 className="text-xl font-semibold">
        {practice
          ? "Нұсқа тапсырмалары және талдау"
          : "Тапсырма түрі және тест"}
      </h2>
      {!practice && (
        <>
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
            PDF файлын төменнен тіркеңіз. Тест немесе «екеуі бірге» таңдалса,
            оқушы келесі сабаққа өту үшін 80%-дан көп жинауы керек. Тест
            өзгерсе, бұрынғы нәтижелер жаңадан тапсыруды талап етеді.
          </p>
        </>
      )}
      {!practice && mode === "pdf" && (
        <Button
          variant="ghost"
          className="my-3"
          onClick={() => setShowPdfCode(!showPdfCode)}
        >
          {showPdfCode
            ? "Тест кодын жинау"
            : "Сақталған тест кодын қарау / өзгерту"}
        </Button>
      )}
      <div
        hidden={!practice && mode === "pdf" && !showPdfCode}
        className="quiz-authoring-fields"
      >
        <ol className="my-5 list-decimal space-y-2 pl-5 text-sm text-muted">
          {!practice && (
            <li>Тапсырма түрін таңдаңыз: PDF, тест немесе екеуі бірге.</li>
          )}
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
          <p className="mb-3 text-sm text-muted">
            Толық .tex құжаты, Markdown ішіндегі TeX, choices/oneparchoices, A),
            A. және (A) жауаптары қабылданады. Дұрыс жауап пен шешімді бөлек
            енгізіңіз: CorrectChoice белгісі жалғыз өзі жеткіліксіз.
          </p>
          <pre className="overflow-auto p-3 text-xs">{example}</pre>
          <p className="text-xs text-muted">
            1–100 сұрақ. \question немесе \qnum&#123;1&#125;. Әрқайсысында A–D
            жауаптары және жауаптар бөлімінде шешімі болсын. «Жауабы: B»
            шешімнің басында да, соңында да жазыла алады; нүкте міндетті емес.
            $...$ формулалары, қарапайым TikZ: coordinate, draw, path, node,
            кесінділер мен доғалар қолданылады. Толық TeX бағдарламасы
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
          Бір файлда сұрақтар да, жауаптар да болса, файлдан жүктегенде
          автоматты түрде бөлінеді. Толық кодты бірінші өріске де қоюға болады —
          екінші өрісті бос қалдырыңыз.
        </p>
        {
          <div className="my-5 rounded-2xl border border-line p-4 text-sm">
            <p>
              Нұсқада: A–D — бір жауап; A–F — бірнеше жауап; tabular / multirow
              — сәйкестендіру. Сұрақтарды шешімсіз алдын ала көруге болады,
              бірақ сақтау үшін жауап кілті мен толық шешімі қажет.
            </p>
            <p className="mt-2">
              Шешімдерді ретімен жазыңыз: \qnum&#123;1&#125;, жеке жолда
              «Жауабы: B», «Жауабы: A, C, E» немесе «Жауабы: 1-B, 2-C», келесі
              жолда толық шығару жолы. Оқушы аяқтағаннан кейін қателерін талдай
              алады.
            </p>
            <Button
              className="mt-3"
              variant="secondary"
              disabled={pending || !!solutions.trim()}
              onClick={() => {
                try {
                  setSolutions(practiceSolutionTemplate(source));
                  setError("");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Код дұрыс емес.");
                }
              }}
            >
              Шешімдер үлгісін жасау
            </Button>
          </div>
        }
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
      </div>
      {error && (
        <p role="alert" className="editor-error my-3">
          {error}
        </p>
      )}
      <div className="editor-toolbar my-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          disabled={pending || !source.trim() || (!practice && mode === "pdf")}
          onClick={inspect}
        >
          Алдын ала қарау
        </Button>
        <Button disabled={pending} onClick={() => void save()}>
          {pending
            ? "Сақталуда..."
            : practice
              ? "Нұсқа тапсырмаларын сақтау"
              : "Тапсырма түрін және тестті сақтау"}
        </Button>
        <span role="status" className="text-xs text-muted">
          {dirty ? "Сақталмаған өзгерістер бар" : "Өзгерістер сақталған"}
        </span>
      </div>
      {selected && (practice || mode !== "pdf") && (
        <div className="quiz-preview">
          <p className="mb-4" role="status">
            {preview.length} сұрақ
            {!selected.solution && (
              <span className="block text-sm text-muted">
                Бұл — сұрақтардың алдын ала көрінісі. Сақтау үшін жауап пен
                шешімін қосыңыз.
              </span>
            )}
            {!practice && (
              <>
                {" "}
                · өту үшін кемінде {Math.floor(preview.length * 0.8) + 1} дұрыс
                жауап
              </>
            )}
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
          {"kind" in selected && selected.kind === "matching" ? (
            <MatchingTable
              key={previewIndex}
              rows={selected.rows}
              options={selected.options}
            />
          ) : (
            <div className="quiz-options">
              {selected.options.map((o, j) => (
                <div
                  className="flex items-start gap-3 rounded-xl border border-line p-3"
                  key={j}
                >
                  <span>{"ABCDEF"[j]})</span>
                  <QuizText text={o} />
                </div>
              ))}
            </div>
          )}
          {selected.solution && (
            <details className="quiz-solution">
              <summary>
                Дұрыс жауап пен шешім ·{" "}
                {Array.isArray(selected.answer)
                  ? selected.answer
                      .map(
                        (a, i) =>
                          `${"rows" in selected && selected.rows.length ? `${i + 1}-` : ""}${"ABCDEF"[a]}`,
                      )
                      .join(", ")
                  : "ABCDEF"[selected.answer]}
              </summary>
              <QuizText text={selected.solution} />
            </details>
          )}
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
