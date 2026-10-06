"use client";
import { useActionToast } from "@/components/ui/toast";
import { useActionState, useId, useState } from "react";
import { editContent } from "@/app/(admin)/admin/courses/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type Kind = "course" | "module" | "lesson";
export type ContentValues = {
  id?: string;
  title: string;
  description?: string | null;
  is_published?: boolean;
  video_url?: string | null;
  duration?: number;
  lesson_unlock_mode?: "all" | "sequential";
};
export function ContentForm({
  kind,
  values,
  parent,
}: {
  kind: Kind;
  values?: ContentValues;
  parent?: string;
}) {
  const [state, action, pending] = useActionState(editContent, {
    ok: false,
    message: "",
  });
  useActionToast(state);
  const descriptionId = useId();
  return (
    <form action={action} className="space-y-5">
      <input
        type="hidden"
        name="operation"
        value={values?.id ? "save" : "create"}
      />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={values?.id ?? ""} />
      <input type="hidden" name="parent" value={parent ?? ""} />
      <fieldset disabled={pending} className="space-y-5">
        <Input
          label="Атауы"
          name="title"
          required
          maxLength={200}
          defaultValue={values?.title}
        />
        {(values?.id || kind === "course") && (
          <div className="space-y-2">
            <label
              htmlFor={descriptionId}
              className="block text-sm font-medium"
            >
              Сипаттама
            </label>
            <textarea
              id={descriptionId}
              name="description"
              rows={4}
              maxLength={10000}
              defaultValue={values?.description ?? ""}
              className="w-full rounded-xl border border-line bg-white p-3 text-sm"
            />
          </div>
        )}
        {kind === "lesson" && values?.id && (
          <>
            <Input
              label="YouTube сілтемесі / Video ID"
              name="video"
              defaultValue={values.video_url ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs leading-5 text-muted">
              YouTube сілтемесін немесе 11 таңбалы Video ID енгізіңіз. YouTube-та сайтта ойнатуға рұқсат қосулы болуы керек.
              YouTube сілтемесін басқа адамдарға бөлісуге болады: ол қорғалған видео қоймасы емес.
              Қорғалған видео үшін Bunny ID немесе storage://course-media/файл қолданыңыз.
            </p>
            <Input
              label="Ұзақтығы (секунд)"
              name="duration"
              type="number"
              min={0}
              max={2147483647}
              step={1}
              required
              defaultValue={values.duration ?? 0}
            />
          </>
        )}
        {kind === "course" && (
          <div className="space-y-2">
            <label
              htmlFor={`${descriptionId}-unlock`}
              className="block text-sm font-medium"
            >
              Сабақтардың ашылу тәртібі
            </label>
            <select
              id={`${descriptionId}-unlock`}
              name="lesson_unlock_mode"
              defaultValue={values?.lesson_unlock_mode ?? "all"}
              className="w-full rounded-xl border border-line bg-white p-3 text-sm"
            >
              <option value="all">Барлық сабақтар ашық</option>
              <option value="sequential">Кезекпен ашылады</option>
            </select>
            <p className="text-xs text-muted">
              Кезекпен оқу кезінде келесі сабақ алдыңғы жарияланған сабақтар
              аяқталған соң ашылады.
            </p>
          </div>
        )}
        {kind !== "module" && (kind === "course" || values?.id) && (
          <label className="flex items-center gap-3 text-sm">
            <input
              name="published"
              type="checkbox"
              defaultChecked={values?.is_published}
              className="accent-brand"
            />
            Жарияланған
          </label>
        )}
        <Button type="submit">{pending ? "Сақталуда…" : "Сақтау"}</Button>
      </fieldset>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`text-sm ${state.ok ? "text-brand" : "text-red-700"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export function ContentDialog({
  label,
  kind,
  values,
  parent,
}: {
  label: string;
  kind: Kind;
  values?: ContentValues;
  parent?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        {open && <ContentForm kind={kind} values={values} parent={parent} />}
      </Modal>
    </>
  );
}

export function ContentAction({
  kind,
  id,
  operation,
  label,
  confirmation,
  direction,
  published,
  disabled,
}: {
  kind: Kind;
  id: string;
  operation: "delete" | "move" | "publish" | "remove_homework";
  label: string;
  confirmation?: string;
  direction?: number;
  published?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editContent, {
    ok: false,
    message: "",
  });
  useActionToast(state);
  const form = (
    <form action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="direction" value={direction ?? ""} />
      <input
        type="hidden"
        name="published"
        value={String(published ?? false)}
      />
      {confirmation && (
        <p className="text-sm leading-6 text-muted">{confirmation}</p>
      )}
      <Button
        type="submit"
        variant="secondary"
        disabled={pending || disabled || (!!confirmation && state.ok)}
      >
        {pending ? "Сақталуда…" : confirmation ? "Растау" : label}
      </Button>
      {confirmation && (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          {state.ok ? "Жабу" : "Бас тарту"}
        </Button>
      )}
      {state.message && (
        <p role="status" className="text-xs text-muted">
          {state.message}
        </p>
      )}
    </form>
  );
  return confirmation ? (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title={label}
      >
        {form}
      </Modal>
    </>
  ) : (
    form
  );
}
