"use client";
import { useState, useSyncExternalStore, type ReactNode } from "react";
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const desktopSnapshot = () => window.matchMedia("(min-width: 768px)").matches;
export function CurriculumPanel({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  const desktop = useSyncExternalStore(subscribe, desktopSnapshot, () => false);
  const [expanded, setExpanded] = useState<boolean | null>(null);
  return (
    <details
      className="lesson-curriculum"
      open={expanded ?? desktop}
      onToggle={(event) => {
        setExpanded(event.currentTarget.open);
      }}
    >
      <summary>
        Курс бағдарламасы · {count} сабақ{" "}
        <span className="ml-auto text-xs">
          {(expanded ?? desktop) ? "Жинау −" : "Ашу +"}
        </span>
      </summary>
      {children}
    </details>
  );
}
