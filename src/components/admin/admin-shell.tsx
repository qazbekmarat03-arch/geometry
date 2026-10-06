import type { ReactNode } from "react";
import { AdminSidebar } from "./sidebar";
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="workspace min-h-screen">
      <AdminSidebar />
      <div className="workspace-content">
        <header className="workspace-header hidden items-center justify-between px-12 lg:flex">
          <p className="text-[11px] text-muted">
            DURYSTAP <span className="mx-3 text-ink/20">/</span> Басқару
            кеңістігі
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">Әкімші</span>
            <span className="flex size-8 items-center justify-center rounded-full border border-line bg-surface font-display text-xs">
              D.
            </span>
          </div>
        </header>
        <main id="main" className="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}
