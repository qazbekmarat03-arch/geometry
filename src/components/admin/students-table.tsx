import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import type { Student } from "@/lib/admin/queries";

export function StudentsTable({ students }: { students: Student[] }) {
  if (!students.length)
    return (
      <EmptyState
        title="Оқушылар әлі қосылмаған."
        description="Тіркелген оқушылар осы жерде көрсетіледі."
      />
    );
  return (
    <div
      className="editorial-table"
      tabIndex={0}
      role="region"
      aria-label="Оқушылар кестесі"
    >
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-line bg-surface/60 text-xs text-muted">
          <tr>
            {["Оқушы", "Email", "Күйі", "Тіркелген күні"].map((title) => (
              <th key={title} scope="col" className="px-6 py-4 font-medium">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {students.map((student) => (
            <tr
              key={student.id}
              className="transition-colors hover:bg-surface/50"
            >
              <th scope="row" className="px-6 py-5 font-medium">
                <Link
                  href={`/admin/students/${student.id}`}
                  className="student-name text-ink hover:text-brand"
                >
                  <span className="identity-mark" aria-hidden="true">
                    {(student.full_name || "О").slice(0, 1)}
                  </span>
                  <span>{student.full_name || "Аты көрсетілмеген"}</span>
                </Link>
              </th>
              <td className="px-6 py-5 text-muted">{student.email || "—"}</td>
              <td className="px-6 py-5">
                <Badge
                  className={student.is_active ? "" : "bg-surface text-muted"}
                >
                  {student.is_active ? "Белсенді" : "Өшірілген"}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-6 py-5 text-muted">
                <time dateTime={student.created_at}>
                  {new Intl.DateTimeFormat("kk-KZ", {
                    dateStyle: "medium",
                    timeZone: "Asia/Almaty",
                  }).format(new Date(student.created_at))}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
