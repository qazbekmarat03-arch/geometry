export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-[5px] overflow-hidden rounded-full bg-[#1f4432]"
    >
      <div
        className="h-full rounded-full bg-[#2ee59d] transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
