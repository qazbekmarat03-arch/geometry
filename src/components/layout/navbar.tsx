import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
import { ButtonLink } from "@/components/ui/button";
import { MobileNavigation } from "./mobile-navigation";
const links = [
  { href: "/#about", title: "Курс туралы" },
  { href: "/#program", title: "Бағдарлама" },
  { href: "/#approach", title: "Қалай оқимыз?" },
  { href: "/#faq", title: "FAQ" },
];
export function Navbar() {
  return (
    <header className="sticky top-3 z-40 px-0 md:px-6">
      <div className="public-nav">
        <MobileNavigation breakpoint="md" links={links} />
        <div className="hidden min-h-[76px] items-center justify-between gap-5 px-7 md:flex">
          <Logo />
          <nav
            aria-label="Негізгі навигация"
            className="flex items-center gap-6 text-[12px] text-muted lg:gap-9"
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.title}
              </Link>
            ))}
          </nav>
          <ButtonLink href="/login" className="min-h-10 px-5 py-2">
            Кіру <ArrowUpRight size={15} />
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
