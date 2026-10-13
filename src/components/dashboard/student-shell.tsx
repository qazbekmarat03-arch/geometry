"use client";
import { useSyncExternalStore } from "react";
import { Sun, Moon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { StudentSidebar } from "./sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("workspace-preference", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("workspace-preference", callback);
  };
}
function read(key: string) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}
function usePreference(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );
  return [
    value,
    () => {
      try {
        localStorage.setItem(key, String(!value));
      } catch {
        /* Storage can be disabled. */
      }
      window.dispatchEvent(new Event("workspace-preference"));
    },
  ] as const;
}
export function StudentShell({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const [light, toggleLight] = usePreference("durystap-student-light");
  const [collapsed, toggleMenu] = usePreference(
    "durystap-student-menu-collapsed",
  );
  return (
    <div
      className={`workspace academy-workspace ${admin ? "admin-workspace" : "student-workspace"} min-h-screen ${light ? "workspace-light" : ""} ${collapsed ? "menu-collapsed" : ""}`}
    >
      {admin ? <AdminSidebar /> : <StudentSidebar />}
      <div className="workspace-content">
        <header className="workspace-header flex items-center justify-between gap-3 px-5 lg:px-12">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border border-line p-3 text-sm lg:flex"
            onClick={toggleMenu}
            aria-expanded={!collapsed}
            aria-controls={admin ? "admin-navigation" : "student-navigation"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            {collapsed ? "Мәзірді ашу" : "Мәзірді жинау"}
          </button>
          <p className="hidden text-[11px] text-muted xl:block">
            DURYSTAP <span className="mx-3 text-ink/20">/</span>{" "}
            {admin ? "Басқару кеңістігі" : "Оқу кеңістігі"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLight}
              aria-pressed={light}
              className="flex items-center gap-2 rounded-xl border border-line p-3 text-sm"
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
              {light ? "Қараңғы режим" : "Жарық режим"}
            </button>
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
