"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTheory } from "@/app/(admin)/admin/theory/actions";
import { QuizText } from "@/components/course/quiz-text";
import { useToast } from "@/components/ui/toast";
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
