"use client";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { editContent } from "@/app/(admin)/admin/courses/actions";
import { ContentAction, ContentDialog } from "./content-editor";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
type Item = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: {
    id: string;
    title: string;
    position: number;
    is_published: boolean;
  }[];
};
function ReorderList({
  kind,
  rows,
}: {
  kind: "module" | "lesson";
  rows: { id: string; content: ReactNode }[];
}) {
  const dragged = useRef<number | null>(null),
    busy = useRef(false);
  const [pending, setPending] = useState(false),
    [over, setOver] = useState<number | null>(null);
  const router = useRouter(),
    toast = useToast();
  async function move(target: number) {
    const source = dragged.current;
    dragged.current = null;
    setOver(null);
    if (source === null || source === target || busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const direction = target > source ? 1 : -1;
      for (let i = 0; i < Math.abs(target - source); i++) {
        const form = new FormData();
        form.set("kind", kind);
        form.set("id", rows[source].id);
        form.set("operation", "move");
        form.set("direction", String(direction));
        const result = await editContent({ ok: false, message: "" }, form);
        if (!result.ok) throw new Error(result.message);
      }
      toast({ message: "Өзгерістер сақталды" });
    } catch {
      toast({
        message: "Қате орын алды",
        description: "Ретті сақтау аяқталмады. Қайта көріңіз.",
        error: true,
      });
    } finally {
      busy.current = false;
      setPending(false);
      router.refresh();
    }
  }
  return (
    <ol className="reorder-list" aria-busy={pending}>
      {rows.map((row, i) => (
        <li
          key={row.id}
          className={over === i ? "reorder-item drop-target" : "reorder-item"}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragged.current !== null && !pending) setOver(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void move(i);
          }}
        >
          <button
            type="button"
            className="drag-handle"
            draggable={!pending}
            disabled={pending}
            aria-label="Сүйреп реттеу; пернетақта үшін Жоғары және Төмен батырмаларын қолданыңыз"
            title="Сүйреп реттеу"
            onDragStart={(e) => {
              e.stopPropagation();
              dragged.current = i;
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", row.id);
            }}
            onDragEnd={() => {
              dragged.current = null;
              setOver(null);
            }}
          >
            <GripVertical size={15} />
          </button>
          <div className={pending ? "pointer-events-none opacity-60" : ""}>
            {row.content}
          </div>
        </li>
      ))}
    </ol>
  );
}
export function CurriculumEditor({ modules }: { modules: Item[] }) {
  return (
    <ReorderList
      kind="module"
      rows={modules.map((module, index) => {
        const lessons = [...module.lessons].sort(
          (a, b) => a.position - b.position,
        );
        return {
          id: module.id,
          content: (
            <section className="editor-module">
              <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <h3>
                  <span className="module-order mr-4">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {module.title}
                  <small className="ml-4 text-xs font-normal text-muted">
                    {lessons.length} сабақ
                  </small>
                </h3>
                <div className="editor-tools flex flex-wrap gap-2">
                  <ContentAction
                    kind="module"
                    id={module.id}
                    operation="move"
                    direction={-1}
                    label="↑ Жоғары"
                    disabled={index === 0}
                  />
                  <ContentAction
                    kind="module"
                    id={module.id}
                    operation="move"
                    direction={1}
                    label="↓ Төмен"
                    disabled={index === modules.length - 1}
                  />
                  <ContentDialog kind="module" values={module} label="Өңдеу" />
                  <ContentAction
                    kind="module"
                    id={module.id}
                    operation="delete"
                    label="Жою"
                    confirmation="Модуль, оның сабақтары және сол сабақтардағы оқу прогресі біржола жойылады. Жалғастырасыз ба?"
                  />
                </div>
              </div>
              <ReorderList
                kind="lesson"
                rows={lessons.map((lesson, j) => ({
                  id: lesson.id,
                  content: (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
                      <div>
                        <ButtonLink
                          variant="ghost"
                          href={"/admin/courses/lessons/" + lesson.id}
                          className="!p-0 text-sm"
                        >
                          {index + 1}.{j + 1} &nbsp; {lesson.title}
                        </ButtonLink>
                        <Badge className="ml-4">
                          {lesson.is_published ? "Жарияланған" : "Жоба"}
                        </Badge>
                      </div>
                      <div className="editor-tools flex gap-2">
                        <ContentAction
                          kind="lesson"
                          id={lesson.id}
                          operation="move"
                          direction={-1}
                          label="↑ Жоғары"
                          disabled={j === 0}
                        />
                        <ContentAction
                          kind="lesson"
                          id={lesson.id}
                          operation="move"
                          direction={1}
                          label="↓ Төмен"
                          disabled={j === lessons.length - 1}
                        />
                      </div>
                    </div>
                  ),
                }))}
              />
              {!lessons.length && (
                <p className="mb-6 text-sm text-muted">
                  Бұл бөлімге сабақтар әлі қосылмаған.
                </p>
              )}
              <div className="mt-5">
                <ContentDialog
                  kind="lesson"
                  parent={module.id}
                  label="+ Сабақ қосу"
                />
              </div>
            </section>
          ),
        };
      })}
    />
  );
}
