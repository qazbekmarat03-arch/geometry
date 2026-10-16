import { ClipboardList, Gift, Layers } from "lucide-react";

export function PracticeBadge({ title, free }: { title: string; free: boolean }) {
  const number = title.match(/(?:№\s*|нұсқа\s*[:№-]?\s*)(\d+)/i)?.[1]
    ?? title.match(/(\d+)\s*(?:[-–.]\s*)?(?:ші|шы)?\s*нұсқа/i)?.[1];
  return (
    <div className="practice-card-heading">
      <div className="practice-number" aria-label={number ? `№${number} нұсқа` : "Нұсқа"}>
        <ClipboardList size={22} aria-hidden="true" />
        {number && <strong>{number.padStart(2, "0")}</strong>}
      </div>
      <span className={`practice-access-badge ${free ? "is-free" : ""}`}>
        {free ? <Gift size={15} aria-hidden="true" /> : <Layers size={15} aria-hidden="true" />}
        {free ? "Тегін нұсқа" : "500 ₸ · талдауымен"}
      </span>
    </div>
  );
}
