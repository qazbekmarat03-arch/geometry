"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTheory } from "@/app/(admin)/admin/theory/actions";
import { QuizText } from "@/components/course/quiz-text";
import { useToast } from "@/components/ui/toast";
import { CodeExample } from "./code-example";
const theoryExample = String.raw`\section{Үшбұрыштың ауданы}
\textbf{Ереже.} Үшбұрыштың ауданы табаны мен сол табанға түсірілген биіктігінің көбейтіндісінің жартысына тең.
\[
S = \frac{a \cdot h}{2}
\]
Мұндағы $a$ — табан, $h$ — осы табанға түсірілген биіктік.

\subsection{Мысал}
Табаны $12$ см, биіктігі $5$ см. Ауданын табыңыз.
\[
S = \frac{12 \cdot 5}{2} = 30\text{ см}^2
\]
\textbf{Жауабы:} $30$ см$^2$.

\subsection{Есте сақтаңыз}
\begin{itemize}
\item Биіктік таңдалған табанға перпендикуляр түсіріледі.
\item Аудан квадрат бірліктермен өлшенеді.
\end{itemize}`;
type Topic = {
  id: string;
  course_id: string;
  title: string;
  source: string;
  position: number;
  is_published: boolean;
};
export function TheoryEditor({
  courses,
  topic,
}: {
  courses: { id: string; title: string }[];
  topic?: Topic;
}) {
  const [source, setSource] = useState(topic?.source || "");
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const toast = useToast(),
    router = useRouter();
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        const form = new FormData(e.currentTarget);
        setPending(true);
        try {
          const result = await saveTheory(form);
          toast({ message: result.message, error: !result.ok });
          if (result.ok) {
            router.push("/admin/theory");
            router.refresh();
          }
        } catch {
          toast({ message: "Қате орын алды. Қайта көріңіз.", error: true });
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="id" value={topic?.id || ""} />
      <label className="block">
        Курс
        <select
          name="course_id"
          defaultValue={topic?.course_id}
          required
          className="mt-2 block w-full border p-3"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Тақырып
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={topic?.title}
          className="mt-2 block w-full border p-3"
        />
      </label>
      <label className="block">
        Реті
        <input
          name="position"
          type="number"
          min={0}
          max={10000}
          defaultValue={topic?.position || 0}
          className="mt-2 block w-full border p-3"
        />
      </label>
      <label className="flex gap-3">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={topic?.is_published}
        />
        Оқушыларға жариялау
      </label>
      <details className="rounded-2xl border border-line p-4">
        <summary className="cursor-pointer text-brand">
          Теория кодының үлгісі
        </summary>
        <p className="mt-3 text-sm text-muted">
          Кодты көшіріп, төмендегі теория өрісіне қойыңыз. Тақырыпты,
          түсіндірмені және формулаларды өзіңізге сай өзгертіп, алдын ала
          көріңіз. Көшіру сақталған мәтінді өзгертпейді.
        </p>
        <CodeExample title="Теорияның дайын TeX үлгісі" code={theoryExample} />
      </details>
      <label className="block">
        Теорияның TeX коды
        <textarea
          name="source"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPreview(null);
          }}
          required
          maxLength={100000}
          rows={18}
          className="mt-2 block w-full border p-4 font-mono text-sm"
          spellCheck={false}
        />
      </label>
      <p className="text-sm text-muted">
        Формулалар, бөлімдер, тізімдер және қолдау көрсетілетін TikZ сызбалары.
        Толық LaTeX компиляторы емес: сыртқы файлдар, пакеттер мен еркін
        макростар орындалмайды. Жарияламас бұрын алдын ала көріңіз.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="premium-button button-secondary px-5 py-3"
          disabled={pending || !source.trim()}
          onClick={() => setPreview(source)}
        >
          Алдын ала көру
        </button>
        <button
          disabled={pending || !courses.length}
          className="premium-button button-primary px-5 py-3"
        >
          {pending ? "Жүктелуде..." : "Сақтау"}
        </button>
      </div>
      {preview !== null && (
        <section
          aria-label="Теорияны алдын ала көру"
          className="premium-card p-6"
        >
          <QuizText text={preview} />
        </section>
      )}
    </form>
  );
}
