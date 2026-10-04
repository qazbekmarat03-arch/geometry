"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  UserRound,
  Users,
  Play,
  KeyRound,
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import { Logo } from "./logo";
import { MobileNavigation } from "./mobile-navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/app/auth/actions";
import { cn } from "@/lib/utils";
const studentLinks = [
  { href: "/dashboard", title: "Басты бет", icon: House },
  { href: "/dashboard/courses", title: "Менің курстарым", icon: BookOpen },
  {
    href: "/dashboard/progress",
    title: "Прогресс",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/dashboard/profile", title: "Профиль", icon: UserRound },
];
const adminLinks = [
  { href: "/admin", title: "Басты бет", icon: House },
  { href: "/admin/students", title: "Оқушылар", icon: Users },
  { href: "/admin/courses", title: "Курстар", icon: BookOpen },
  { href: "/admin/lessons", title: "Сабақтар", icon: Play },
  { href: "/admin/access", title: "Қолжетімділік", icon: KeyRound },
];
export function WorkspaceSidebar({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const links = admin ? adminLinks : studentLinks;
  return (
    <aside className="workspace-sidebar">
      <MobileNavigation
        links={links.map(({ href, title }) => ({ href, title }))}
        signedIn
      />
      <div className="hidden px-7 pb-12 pt-9 lg:block">
        <Logo />
      </div>
      <div className="mb-5 hidden items-center gap-2 px-8 lg:flex">
        <span className="size-1 rounded-full bg-brand" />
        <p className="text-[9px] font-medium tracking-[.17em] text-muted">
          {admin ? "БАСҚАРУ КЕҢІСТІГІ" : "МЕНІҢ ОҚУ КЕҢІСТІГІМ"}
        </p>
      </div>
      <nav
        aria-label={admin ? "Әкімші навигациясы" : "Студент навигациясы"}
        className="hidden space-y-1.5 px-4 lg:block"
      >
        {links.map(({ href, title, icon: Icon }, i) => {
          const active =
            pathname === href ||
            (i > 0 && pathname.startsWith(href + "/")) ||
            (href === "/admin/lessons" && pathname === "/admin/homework");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3.5",
                !active && "text-muted",
              )}
            >
              <Icon size={17} strokeWidth={1.5} />
              {title}
              {active && (
                <span className="ml-auto size-1 rounded-full bg-lime" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden px-5 pb-6 pt-16 lg:block">
        <div className="mb-5 border-y border-line px-3 py-6">
          <p className="font-display text-lg font-medium leading-snug tracking-tight">
            {admin ? "Жүйелі білім." : "Әр қадам —"}
            <br />
            <span className="text-muted">
              {admin ? "Анық басқару." : "жаңа мүмкіндік."}
            </span>
          </p>
          <Link
            href={admin ? "/dashboard" : "/#program"}
            className="mt-4 inline-flex items-center gap-3 text-[11px] text-muted"
          >
            {admin ? "Оқушы кабинеті" : "Курс туралы"}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <form action={signOut}>
          <SubmitButton className="w-full !border-transparent !bg-transparent !text-muted !shadow-none">
            <LogOut size={15} />
            Шығу
          </SubmitButton>
        </form>
        <p className="mt-5 text-center text-[8px] tracking-[.16em] text-muted">
          DURYSTAP · GEOMETRY
        </p>
      </div>
    </aside>
  );
}
