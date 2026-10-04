"use client";
import { useActionToast } from "@/components/ui/toast";
import { useActionState } from "react";
import { Upload } from "lucide-react";
import { uploadHomework } from "@/app/(admin)/admin/homework/actions";
import { Button } from "@/components/ui/button";
export function HomeworkUpload({
  lessons,
  fixedLessonId,
}: {
  lessons: { id: string; label: string }[];
  fixedLessonId?: string;
}) {
  const [state, action, pending] = useActionState(uploadHomework, {
    ok: false,
    message: "",
  });
  useActionToast(state);
  return (
    <form action={action} className="space-y-6">
      {fixedLessonId ? (
        <input type="hidden" name="lessonId" value={fixedLessonId} />
      ) : (
        <div>
          <label
            htmlFor="homework-lesson"
            className="mb-2 block text-sm font-medium"
          >
            Сабақ
          </label>
          <select
            id="homework-lesson"
            name="lessonId"
            required
            disabled={pending}
            defaultValue=""
            className="w-full rounded-xl border border-line bg-white p-3 text-sm"
          >
            <option value="" disabled>
              Сабақты таңдаңыз
            </option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label
          htmlFor="homework-file"
          className="mb-2 block text-sm font-medium"
        >
          PDF үй тапсырмасы
        </label>
        <input
          id="homework-file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={pending}
          className="w-full rounded-xl border border-dashed border-line p-4 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-brand"
        />
        <p className="mt-2 text-xs leading-6 text-muted">
          PDF · 10 МБ-қа дейін. Жаңа файл осы сабақтың бұрынғы тапсырмасын
          ауыстырады.
        </p>
      </div>
      <Button type="submit" disabled={pending || !lessons.length}>
        <Upload size={17} />
        {pending ? "Жүктелуде…" : "PDF тіркеу"}
      </Button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "text-sm text-brand" : "text-sm text-red-700"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
