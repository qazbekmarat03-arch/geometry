"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "./logo";
import { Modal } from "@/components/ui/modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/app/auth/actions";
import { cn } from "@/lib/utils";
export function MobileNavigation({
  links,
  signedIn = false,
  breakpoint = "lg",
}: {
  links: { href: string; title: string }[];
  signedIn?: boolean;
  breakpoint?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const media = window.matchMedia(
      `(min-width: ${breakpoint === "md" ? 768 : 1024}px)`,
    );
    const changed = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, [breakpoint]);
  return (
    <div
      className={cn(
        "flex min-h-[72px] items-center justify-between gap-3 px-5",
        breakpoint === "md" ? "md:hidden" : "lg:hidden",
      )}
    >
      <Logo />
      <div className="flex items-center gap-2">
        {!signedIn && (
          <ButtonLink href="/login" variant="secondary" className="px-3">
            Кіру
          </ButtonLink>
        )}
        <Button
          variant="ghost"
          className="px-3"
          aria-label="Мәзірді ашу"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Мәзір">
        <nav aria-label="Мобильді навигация" className="space-y-2">
          {links.map((link, index) => {
            const active =
              !link.href.includes("#") &&
              (pathname === link.href ||
                (index !== 0 && pathname.startsWith(`${link.href}/`)));
            return (
              <Link prefetch={signedIn ? false : undefined}
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-12 items-center rounded-xl px-4 py-3 text-sm",
                  active
                    ? "bg-brand-light font-semibold text-brand"
                    : "hover:bg-surface",
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </nav>
        {signedIn && (
          <form action={signOut} className="mt-6 border-t border-line pt-5">
            <SubmitButton className="w-full">Шығу</SubmitButton>
          </form>
        )}
      </Modal>
    </div>
  );
}
