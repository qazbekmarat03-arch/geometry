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
  const [expanded, setExpanded] = useState(false);
  return (
    <details
      className="lesson-curriculum"
      open={desktop || expanded}
      onToggle={(event) => {
        if (!desktop) setExpanded(event.currentTarget.open);
      }}
    >
      <summary>Курс бағдарламасы · {count} сабақ</summary>
      {children}
    </details>
  );
}
