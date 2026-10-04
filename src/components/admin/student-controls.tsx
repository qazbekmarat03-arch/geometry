"use client";
import { useActionToast } from "@/components/ui/toast";

import { useActionState, useState } from "react";
import {
  addStudent,
  manageStudent,
} from "@/app/(admin)/admin/students/actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StudentControl({
  label,
  description,
  operation,
  studentId,
  accessId,
  invitationId,
}: {
  label: string;
  description: string;
  operation: "activate" | "deactivate" | "remove_access" | "revoke_invitation";
  studentId?: string;
  accessId?: string;
  invitationId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(manageStudent, {
    ok: false,
    message: "",
  });
  useActionToast(state);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title={label}
      >
        <p className="mb-6 text-sm leading-6 text-muted">{description}</p>
        <form action={action}>
          <input type="hidden" name="operation" value={operation} />
          <input type="hidden" name="studentId" value={studentId ?? ""} />
          <input type="hidden" name="accessId" value={accessId ?? ""} />
          <input type="hidden" name="invitationId" value={invitationId ?? ""} />
          {state.message && (
            <p
              role="status"
              className={`mb-4 text-sm ${state.ok ? "text-brand" : "text-red-700"}`}
            >
              {state.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {state.ok ? "Жабу" : "Бас тарту"}
            </Button>
            <Button type="submit" disabled={pending || state.ok}>
              {pending ? "Сақталуда…" : "Растау"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AddStudent({
  courses,
}: {
  courses: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addStudent, {
    ok: false,
    message: "",
  });
  useActionToast(state);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Оқушы қосу</Button>
      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title="Оқушы қосу"
      >
        <p className="mb-5 text-sm leading-6 text-muted">
          Оқушының Google email мекенжайын және курсын таңдаңыз. Осы аккаунтпен
          кіргенде рұқсат автоматты түрде танылады.
        </p>
        {!courses.length ? (
          <p className="text-sm text-muted">Алдымен курс қосу қажет.</p>
        ) : (
          <form action={action} className="space-y-5">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="student@gmail.com"
              maxLength={254}
              required
              disabled={pending}
            />
            <div className="space-y-2">
              <label
                htmlFor="student-course"
                className="block text-sm font-medium"
              >
                Курс
              </label>
              <select
                id="student-course"
                name="courseId"
                required
                disabled={pending}
                defaultValue=""
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
              >
                <option value="" disabled>
                  Курсты таңдаңыз
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            {state.message && (
              <p
                role="status"
                className={`text-sm leading-6 ${state.ok ? "text-brand" : "text-red-700"}`}
              >
                {state.message}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Сақталуда…" : "Рұқсат беру"}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
