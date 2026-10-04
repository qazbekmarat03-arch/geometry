import Link from "next/link";
import { PageHeading } from "@/components/layout/page-heading";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const sections = {
  lessons: {
    title: "Сабақтар",
    description: "Курстардағы сабақтар мен үй тапсырмалары.",
  },
  access: {
    title: "Қолжетімділік",
    description: "Оқушыларға берілген курс рұқсаттары.",
  },
};
type Section = keyof typeof sections;
function isSection(value: string): value is Section {
  return Object.hasOwn(sections, value);
}
type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  return {
    title: isSection(section) ? sections[section].title : "Бет табылмады",
  };
}

export default async function AdminListPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { section } = await params;
  if (!isSection(section)) notFound();
  const search = await searchParams;
  const parsedPage = Number(search.page ?? 1);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, 100000)
      : 1;
  const db = await createClient();
  const start = (page - 1) * 20;
  const result =
    section === "lessons"
      ? await db
          .from("lessons")
          .select("id,title,is_published,modules(title,courses(title))", {
            count: "exact",
          })
          .order("created_at", { ascending: false })
          .order("id")
          .range(start, start + 19)
      : await db
          .from("course_access")
          .select(
            "id,is_active,expires_at,profiles(full_name,email),courses(title)",
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .order("id")
          .range(start, start + 19);
  if (result.error) throw new Error("Admin list could not be loaded.");
  type Row = {
    id: string;
    title: string;
    is_published: boolean;
    is_active: boolean;
    expires_at: string | null;
    profiles: { full_name: string | null; email: string | null } | null;
    courses: { title: string } | null;
    modules: { title: string; courses: { title: string } | null } | null;
  };
  const rows = (result.data ?? []) as unknown as Row[];
  const total = result.count ?? 0;
  const now = new Date().getTime();
  const pageHref = (number: number) => `/admin/${section}?page=${number}`;
  return (
    <>
      <PageHeading
        label={section === "access" ? "ҚОЛЖЕТІМДІЛІК / 05" : "ОҚУ МАЗМҰНЫ / 04"}
        title={sections[section].title}
        description={sections[section].description}
        action={
          <ButtonLink
            href={section === "lessons" ? "/admin/homework" : "/admin/students"}
          >
            {section === "lessons"
              ? "Үй тапсырмаларын басқару"
              : "Оқушыға рұқсат беру"}{" "}
            ↗
          </ButtonLink>
        }
      />
      {!rows.length ? (
        <EmptyState
          title="Мәлімет әзірге жоқ"
          description="Қосылған мәліметтер осы жерде көрсетіледі."
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((row) => {
            const expired =
              !!row.expires_at && new Date(row.expires_at).getTime() <= now;
            const enabled =
              section === "access"
                ? row.is_active && !expired
                : row.is_published;
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-4 p-6"
              >
                <div className="min-w-0">
                  <h2 className="break-words text-xl font-medium">
                    {section === "access"
                      ? row.profiles?.full_name ||
                        row.profiles?.email ||
                        "Оқушы"
                      : row.title}
                  </h2>
                  {section === "lessons" && (
                    <p className="mt-1 text-sm text-muted">
                      {row.modules?.courses?.title} · {row.modules?.title}
                    </p>
                  )}
                  {section === "access" && (
                    <>
                      <p className="mt-1 break-words text-sm text-muted">
                        {row.profiles?.email} · {row.courses?.title}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        {row.expires_at
                          ? `Мерзімі: ${new Intl.DateTimeFormat("kk-KZ", { dateStyle: "medium", timeZone: "Asia/Almaty" }).format(new Date(row.expires_at))}`
                          : "Мерзімсіз"}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-5">
                  <Link
                    className="text-xs text-muted hover:text-brand"
                    href={
                      section === "lessons"
                        ? `/admin/courses/lessons/${row.id}`
                        : `/admin/students?q=${encodeURIComponent(row.profiles?.email || "")}`
                    }
                  >
                    Өңдеу ↗
                  </Link>
                  <Badge className={enabled ? "" : "bg-surface text-muted"}>
                    {section === "access"
                      ? !row.is_active
                        ? "Тоқтатылған"
                        : expired
                          ? "Мерзімі аяқталды"
                          : "Белсенді"
                      : enabled
                        ? "Жарияланған"
                        : "Жоба"}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <nav
        aria-label="Беттер"
        className="mt-6 flex flex-wrap items-center justify-between gap-3"
      >
        <p className="text-sm text-muted">
          Барлығы: {total} · {page}-бет
        </p>
        <div className="flex gap-3">
          {page > 1 && (
            <ButtonLink variant="secondary" href={pageHref(page - 1)}>
              Алдыңғы
            </ButtonLink>
          )}
          {start + 20 < total && (
            <ButtonLink variant="secondary" href={pageHref(page + 1)}>
              Келесі
            </ButtonLink>
          )}
        </div>
      </nav>
    </>
  );
}
