import type { ReactNode } from "react";
export function PageHeading({
  label,
  title,
  description,
  action,
}: {
  label: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="interior-heading">
      <div>
        <p className="eyebrow mb-5 text-muted">{label}</p>
        <h1>{title}</h1>
        {description && (
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </header>
  );
}
