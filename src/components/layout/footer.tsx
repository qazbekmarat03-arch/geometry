import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "./container";
import { Logo } from "./logo";
export function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="flex flex-col justify-between gap-8 border-b border-ink/10 pb-10 md:flex-row">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted">
              Нақты ойлауға бастайтын
              <br />
              геометрия.
            </p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm">
            <Link href="/#program" className="inline-flex items-start gap-3">
              Курс бағдарламасы <ArrowUpRight size={15} />
            </Link>
            <Link href="/#faq">Сұрақтар мен жауаптар</Link>
            <Link href="/login">Жеке кабинет</Link>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 pt-7 text-[10px] tracking-wide text-muted">
          <p>© {new Date().getFullYear()} DURYSTAP Geometry</p>
          <p>Ойлан. Түсін. Шеш.</p>
          <span>Қазақ тіліндегі білім кеңістігі</span>
        </div>
      </Container>
    </footer>
  );
}
