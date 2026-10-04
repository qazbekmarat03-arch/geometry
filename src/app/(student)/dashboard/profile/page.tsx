import { getDashboardData } from "@/lib/db/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { switchAccount } from "@/app/auth/actions";
import { PageHeading } from "@/components/layout/page-heading";
export const metadata = { title: "Профиль" };
export default async function ProfilePage() {
  const { profile, courses } = await getDashboardData();
  return (
    <>
      <PageHeading
        label="ЖЕКЕ КЕҢІСТІК / 04"
        title="Сенің профилің."
        description="Оқу жолың осы жерден басталады."
      />
      <div className="profile-composition">
        <section className="profile-identity">
          <span className="identity-mark" aria-hidden="true">
            {(profile.full_name || "О").slice(0, 1)}
          </span>
          <h2 className="text-3xl leading-tight">
            {profile.full_name || "Оқушы"}
          </h2>
          <p className="mt-3 break-all text-sm text-muted">{profile.email}</p>
          <Badge className="mt-6">Белсенді аккаунт</Badge>
        </section>
        <section>
          <dl className="profile-fields">
            <div>
              <dt>Аты-жөні</dt>
              <dd>{profile.full_name || "Көрсетілмеген"}</dd>
            </div>
            <div>
              <dt>Электрондық пошта</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Кіру тәсілі</dt>
              <dd>Google аккаунты</dd>
            </div>
            <div>
              <dt>Белсенді курстар</dt>
              <dd>
                {courses.length}
                <ButtonLink
                  href="/dashboard/courses"
                  variant="ghost"
                  className="ml-4 !p-0 text-xs"
                >
                  Курстарға өту ↗
                </ButtonLink>
              </dd>
            </div>
          </dl>
          <form action={switchAccount} className="mt-8">
            <Button type="submit" variant="secondary">
              Басқа аккаунтпен кіру
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
