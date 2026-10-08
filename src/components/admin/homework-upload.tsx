"use client";
import { useActionToast } from "@/components/ui/toast";
import { useActionState, useState } from "react";
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
  const [source, setSource] = useState("file");
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
      <fieldset className="space-y-3" disabled={pending}>
        <legend className="text-sm font-medium">
          Тапсырманы қосу тәсілі
        </legend>
        <input type="hidden" name="source" value={source} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={source === "file" ? "primary" : "secondary"} aria-pressed={source === "file"} onClick={() => setSource("file")}>Компьютерден PDF</Button>
          <Button type="button" variant={source === "drive" ? "primary" : "secondary"} aria-pressed={source === "drive"} onClick={() => setSource("drive")}>Google Drive сілтемесі</Button>
        </div>
      </fieldset>
      {source === "drive" ? (
        <div className="space-y-3">
          <label htmlFor="homework-drive" className="block text-sm font-medium">
            PDF файлының Drive сілтемесі
          </label>
          <input
            id="homework-drive"
            name="driveUrl"
            type="url"
            required
            disabled={pending}
            placeholder="https://drive.google.com/file/d/…/view"
            className="w-full rounded-xl border border-line bg-surface p-3 text-sm"
          />
          <label htmlFor="homework-name" className="block text-sm font-medium">
            Файл атауы
          </label>
          <input
            id="homework-name"
            name="fileName"
            maxLength={140}
            placeholder="Үшбұрыштар — үй тапсырмасы"
            disabled={pending}
            className="w-full rounded-xl border border-line bg-surface p-3 text-sm"
          />
          <p className="text-xs leading-6 text-muted">
            Drive-та «Сілтемесі бар кез келген адам — оқырман» рұқсатын қосыңыз.
            PDF (10 МБ-қа дейін) жабық қоймаға көшіріледі. Сақталғаннан кейін
            Drive рұқсатын жаба аласыз; кейінгі Drive өзгерістері автоматты
            көшірілмейді.
          </p>
        </div>
      ) : (
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
      )}
      <Button
        type="submit"
        disabled={pending || (!fixedLessonId && !lessons.length)}
      >
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
