import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { HomeworkUpload } from "@/components/admin/homework-upload";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
export const metadata = { title: "Үй тапсырмалары" };
export default async function HomeworkAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id,title,modules!inner(title,courses!inner(title))")
    .order("created_at");
  if (error) throw new Error("Сабақтар жүктелмеді.");
  const rows = data as unknown as {
    id: string;
    title: string;
    modules: { title: string; courses: { title: string } };
  }[];
  return (
    <>
      <ButtonLink href="/admin" variant="ghost" className="mb-5">
        ← Басқару панелі
      </ButtonLink>
      <h1 className="text-3xl font-semibold tracking-tight">Үй тапсырмалары</h1>
      <p className="mb-8 mt-3 text-sm text-muted">
        Сабаққа PDF тапсырмасын тіркеңіз. Файл курсқа рұқсаты бар оқушыларға
        ғана ашылады.
      </p>
      {rows.length ? (
        <Card className="max-w-2xl">
          <HomeworkUpload
            lessons={rows.map((row) => ({
              id: row.id,
              label: `${row.modules.courses.title} / ${row.modules.title} / ${row.title}`,
            }))}
          />
        </Card>
      ) : (
        <EmptyState
          title="Сабақтар әлі жоқ"
          description="Алдымен курсқа сабақ қосыңыз, содан кейін PDF тапсырмасын тіркей аласыз."
        />
      )}
    </>
  );
}
