"use client";
import { useActionToast } from "@/components/ui/toast";

import { useActionState, useId, useState } from "react";
import { setCourseAccess } from "@/app/(admin)/admin/students/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

function AccessForm({
  studentId,
  courseId,
  remove,
  onClose,
}: {
  studentId: string;
  courseId: string;
  remove: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState("none");
  const [state, action, pending] = useActionState(setCourseAccess, {
    ok: false,
    message: "",
  });
  useActionToast(state);
  const selectId = useId();
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="courseId" value={courseId} />
      {remove ? (
        <>
          <input type="hidden" name="mode" value="remove" />
          <p className="text-sm leading-6 text-muted">
            Оқушының осы курсқа рұқсатын жоясыз ба? Күтіп тұрған email рұқсаты
            да жойылады. Оқу прогресі сақталады.
          </p>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor={selectId} className="block text-sm font-medium">
              Қолжетімділік мерзімі
            </label>
            <select
              id={selectId}
              name="mode"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              disabled={pending || state.ok}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
            >
              <option value="none">Мерзімсіз</option>
              <option value="30">30 күн</option>
              <option value="60">60 күн</option>
              <option value="90">90 күн</option>
              <option value="custom">Күнді таңдау</option>
            </select>
          </div>
          {mode === "custom" && (
            <Input
              name="date"
              type="date"
              label="Соңғы қолжетімді күн"
              required
              disabled={pending || state.ok}
            />
          )}
          <p className="text-xs leading-5 text-muted">
            30/60/90 күн бүгіннен есептеледі. Таңдалған күн Алматы уақытымен
            қоса есептеледі. Сақтау бұрынғы мерзімді ауыстырады.
          </p>
        </>
      )}
      {state.message && (
        <p
          role="status"
          className={`text-sm ${state.ok ? "text-brand" : "text-red-700"}`}
        >
          {state.message}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onClose}
        >
          {state.ok ? "Жабу" : "Бас тарту"}
        </Button>
        <Button type="submit" disabled={pending || state.ok}>
          {pending ? "Сақталуда…" : remove ? "Жоюды растау" : "Рұқсат беру"}
        </Button>
      </div>
    </form>
  );
}

export function CourseAccessControls({
  studentId,
  courseId,
  title,
  hasAccess,
}: {
  studentId: string;
  courseId: string;
  title: string;
  hasAccess: boolean;
}) {
  const [dialog, setDialog] = useState<"grant" | "remove" | null>(null);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setDialog("grant")}>
          {hasAccess ? "Мерзімді өзгерту" : "Қолжетімділік беру"}
        </Button>
        <Button variant="secondary" onClick={() => setDialog("remove")}>
          Қолжетімділікті жабу
        </Button>
      </div>
      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={title}
      >
        {dialog && (
          <AccessForm
            key={dialog}
            studentId={studentId}
            courseId={courseId}
            remove={dialog === "remove"}
            onClose={() => setDialog(null)}
          />
        )}
      </Modal>
    </>
  );
}
