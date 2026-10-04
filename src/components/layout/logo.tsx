import Link from "next/link";
export function Logo() {
  return (
    <Link
      href="/"
      aria-label="DURYSTAP Geometry — басты бет"
      className="inline-flex shrink-0 items-center gap-3 text-ink"
    >
      <svg
        width="36"
        height="40"
        viewBox="0 0 36 40"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="20"
          r="15"
          stroke="currentColor"
          strokeWidth="1.15"
        />
        <path
          d="M18 3 33 30H3L18 3Z"
          stroke="currentColor"
          strokeWidth="1.35"
        />
        <path
          d="M18 3v34M3 30l26-19"
          stroke="currentColor"
          strokeWidth=".7"
          opacity=".45"
        />
        <circle cx="18" cy="20" r="2.5" fill="currentColor" />
      </svg>
      <span className="font-display text-[17px] font-bold tracking-[-.055em]">
        DURYSTAP
        <span className="mt-1 block text-[8px] font-medium tracking-[.35em] text-muted">
          G E O M E T R Y
        </span>
      </span>
    </Link>
  );
}
