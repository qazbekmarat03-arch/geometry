import Link from "next/link";
import { BrandMark } from "./brand-mark";
export function Logo() {
  return (
    <Link href="/" aria-label="DURYSTAP Geometry — басты бет" className="inline-flex shrink-0 items-center gap-2.5 text-ink">
      <BrandMark />
      <span className="font-display text-[19px] font-extrabold tracking-[-.045em]">
        <span className="text-brand">DURYS</span><span>TAP</span>
        <span className="mt-0.5 block text-[9px] font-medium tracking-[.08em] text-muted">математика курсы</span>
      </span>
    </Link>
  );
}
