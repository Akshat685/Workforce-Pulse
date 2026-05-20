"use client";

import {
  Activity,
  BarChart3,
  Bot,
  Database,
  LayoutDashboard,
  ListOrdered,
  Users,
  Zap
} from "lucide-react";

export type NavSection =
  | "overview"
  | "charts"
  | "automation"
  | "breakdown"
  | "employees"
  | "data-quality"
  | "assistant";

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "data-quality", label: "Data quality", icon: Database },
  { id: "charts", label: "Analytics", icon: BarChart3 },
  { id: "breakdown", label: "Time sinks", icon: Activity },
  { id: "automation", label: "Automation", icon: ListOrdered },
  { id: "employees", label: "Employees", icon: Users },
  { id: "assistant", label: "AI assistant", icon: Bot }
];

const MOBILE_NAV_IDS: NavSection[] = ["overview", "data-quality", "breakdown", "automation", "assistant"];

export function Sidebar({
  active,
  onNavigate
}: {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
}) {
  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface/95 backdrop-blur-xl lg:flex"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-border px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-emerald/20 ring-1 ring-accent-cyan/30">
              <Zap className="h-4 w-4 text-accent-cyan" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">Workforce Pulse</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted">Enterprise analytics</p>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/20"
                      : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <Icon size={16} className="shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <p className="text-[12px] text-center leading-relaxed text-muted">
              Workforce Pulse
            </p>
          </div>
        </div>
      </aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.filter(({ id }) => MOBILE_NAV_IDS.includes(id)).map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                isActive ? "text-accent-cyan" : "text-muted"
              }`}
            >
              <Icon size={18} aria-hidden />
              <span className="max-w-[4.5rem] truncate">{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}