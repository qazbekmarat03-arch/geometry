import Link from "next/link";
import {
  AddStudent,
  StudentControl,
} from "@/components/admin/student-controls";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { courseAccessLabel, getStudents } from "@/lib/admin/students";

export const metadata = { title: "Оқушылар" };
function pageNumber(value?: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pendingPage?: string;
    active?: string;
  }>;
}) {
  const search = await searchParams;
  const query = (typeof search.q === "string" ? search.q : "")
    .trim()
    .slice(0, 120);
  const page = pageNumber(search.page);
  const pendingPage = pageNumber(search.pendingPage);
  const activeOnly = search.active === "true";
  const data = await getStudents({ query, page, activeOnly, pendingPage });
  const now = new Date().getTime();
  function href(nextPage: number, nextPending: number) {
    return `/admin/students?${new URLSearchParams({ q: query, page: String(nextPage), pendingPage: String(nextPending), ...(activeOnly ? { active: "true" } : {}) })}`;
  }
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-5 text-muted">ОҚУШЫЛАР КЕҢІСТІГІ / 02</p>
          <h1 className="text-3xl font-semibold tracking-tight">Оқушылар</h1>
          <p className="mt-3 text-sm text-muted">
            Оқушылар, курс рұқсаттары және алдын ала қосылған email
            мекенжайлары.
          </p>
        </div>
        <AddStudent courses={data.courses} />
      </div>
      <form
        action="/admin/students"
        className="command-bar mb-9 flex flex-wrap items-end gap-4"
      >
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <Input
            label="Аты немесе email арқылы іздеу"
            name="q"
            defaultValue={query}
            placeholder="Аты немесе student@gmail.com"
            maxLength={120}
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={activeOnly}
            className="accent-brand"
          />
          Тек белсенді
        </label>
        <Button type="submit">Іздеу</Button>
        {(query || activeOnly) && (
          <ButtonLink variant="ghost" href="/admin/students">
            Тазарту
          </ButtonLink>
        )}
      </form>
      <h2 className="mb-4 text-lg font-semibold">
        Тіркелген оқушылар{" "}
        <span className="text-sm font-normal text-muted">({data.total})</span>
      </h2>
      {!data.students.length ? (
        <EmptyState
          title={
            query || activeOnly
              ? "Оқушылар табылмады"
              : "Оқушылар әлі қосылмаған."
          }
          description="Іздеу шартын өзгертіңіз немесе жаңа оқушы қосыңыз."
        />
      ) : (
        <div
          role="region"
          aria-label="Тіркелген оқушылар"
          tabIndex={0}
          className="editorial-table"
        >
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-line bg-surface/60 text-xs text-muted">
              <tr>
                {["Оқушы", "Күйі", "Курстар", "Әрекеттер"].map((title) => (
                  <th key={title} scope="col" className="px-5 py-4 font-medium">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.students.map((student) => (
                <tr key={student.id}>
                  <th scope="row" className="px-5 py-5 font-medium">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="student-name text-ink hover:text-brand"
                    >
                      <span className="identity-mark" aria-hidden="true">
                        {(student.full_name || "О").slice(0, 1)}
                      </span>
                      <span>{student.full_name || "Аты көрсетілмеген"}</span>
                    </Link>
                    <p className="mt-1 font-normal text-muted">
                      {student.email || "—"}
                    </p>
                  </th>
                  <td className="px-5 py-5">
                    <Badge
                      className={
                        student.is_active ? "" : "bg-surface text-muted"
                      }
                    >
                      {student.is_active ? "Белсенді" : "Өшірілген"}
                    </Badge>
                  </td>
                  <td data-label="Курстар" className="px-5 py-5">
                    {!student.course_access.length ? (
                      <span className="text-muted">Курс ашылмаған</span>
                    ) : (
                      <ul className="space-y-2">
                        {student.course_access.map((access) => (
                          <li key={access.id}>
                            <p>{access.courses?.title || "Курс"}</p>
                            <p className="mt-1 text-xs text-muted">
                              {courseAccessLabel(
                                access,
                                student.is_active,
                                now,
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col items-start gap-2">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="inline-flex min-h-11 items-center text-brand hover:underline"
                      >
                        Толығырақ →
                      </Link>
                      <StudentControl
                        key={String(student.is_active)}
                        label={
                          student.is_active
                            ? "Белсенділігін тоқтату"
                            : "Белсендіру"
                        }
                        operation={
                          student.is_active ? "deactivate" : "activate"
                        }
                        studentId={student.id}
                        description={
                          student.is_active
                            ? `${student.email}: платформаға кіруі тоқтатылады. Қайта белсендіргенде бұрынғы курс рұқсаттары сақталады.`
                            : `${student.email}: аккаунтты қайта белсендіруді растайсыз ба?`
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav
        aria-label="Оқушылар беттері"
        className="mt-5 flex items-center justify-between gap-3"
      >
        <p className="text-sm text-muted">{page}-бет</p>
        <div className="flex gap-3">
          {page > 1 && (
            <ButtonLink variant="secondary" href={href(page - 1, pendingPage)}>
              Алдыңғы
            </ButtonLink>
          )}
          {page * 20 < data.total && (
            <ButtonLink variant="secondary" href={href(page + 1, pendingPage)}>
              Келесі
            </ButtonLink>
          )}
        </div>
      </nav>
      <section className="mt-10" aria-labelledby="pending-emails">
        <h2 id="pending-emails" className="text-lg font-semibold">
          Кіруді күтіп тұрған email мекенжайлары{" "}
          <span className="text-sm font-normal text-muted">
            ({data.pendingTotal})
          </span>
        </h2>
        <p className="mb-5 mt-2 text-sm text-muted">
          Оқушы сәйкес Google аккаунтымен кіргенде рұқсат іске қосылады.
        </p>
        {!data.invitations.length ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
            Күтіп тұрған рұқсаттар жоқ.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {data.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {invitation.courses?.title}
                  </p>
                </div>
                <StudentControl
                  operation="revoke_invitation"
                  invitationId={invitation.id}
                  label="Рұқсатты жою"
                  description={`${invitation.email} үшін «${invitation.courses?.title}» курсына рұқсатты жоясыз ба? Оқушы кіріп үлгерген болса, курс рұқсаты да жойылады.`}
                />
              </li>
            ))}
          </ul>
        )}
        <nav
          aria-label="Күтіп тұрған email беттері"
          className="mt-5 flex justify-end gap-3"
        >
          {pendingPage > 1 && (
            <ButtonLink variant="secondary" href={href(page, pendingPage - 1)}>
              Алдыңғы
            </ButtonLink>
          )}
          {pendingPage * 20 < data.pendingTotal && (
            <ButtonLink variant="secondary" href={href(page, pendingPage + 1)}>
              Келесі
            </ButtonLink>
          )}
        </nav>
      </section>
    </>
  );
}
