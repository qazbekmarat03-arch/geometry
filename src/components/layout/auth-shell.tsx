import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./logo";
import { CourseArtwork } from "@/components/course/course-artwork";
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="auth-page grid min-h-screen p-5 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:p-7"
    >
      <section className="auth-art relative hidden min-h-[720px] p-12 lg:block">
        <p className="eyebrow text-white/65">DURYSTAP / GEOMETRY</p>
        <h2 className="relative z-10 mt-20 text-5xl font-medium leading-[1.14] tracking-[-.06em] text-white">
          Білімге
          <br />
          жаңа көзқарас.
        </h2>
        <p className="relative z-10 mt-7 max-w-xs text-sm leading-7 text-white/65">
          Күрделі көрінген нәрсенің
          <br />
          қарапайым логикасын тап.
        </p>
        <CourseArtwork className="absolute -bottom-4 -right-14 w-[110%] text-lime/55" />
        <p className="absolute bottom-10 left-12 text-[10px] tracking-widest text-white/60">
          ОЙЛАН. ТҮСІН. ШЕШ.
        </p>
      </section>
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-3 py-12">
        <div className="w-full max-w-[410px]">
          <Logo />
          <div className="mt-14">{children}</div>
          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-3 text-xs text-muted"
          >
            <ArrowLeft size={14} />
            Басты бетке оралу
          </Link>
        </div>
      </section>
    </main>
  );
}
