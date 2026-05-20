import { Activity, CalendarDays } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { ExportButton } from "./ExportButton";

export function DashboardHeader({ data }: { data: AnalyticsResponse }) {
  return (
    <header className="border-b border-border bg-canvas/80 backdrop-blur-md">
      <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="section-label text-accent-cyan">Executive dashboard</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Where time and money leak
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Recoverable hours, INR impact, repetitive work, and automation priority from activity logs and HRMS.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted sm:justify-end sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5">
              <CalendarDays size={14} className="shrink-0 text-accent-cyan" aria-hidden />
              <span className="truncate">
                {data.dateRange.start ?? "—"} → {data.dateRange.end ?? "—"}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5">
              <Activity size={14} className="shrink-0 text-accent-emerald" aria-hidden />
              {data.dateRange.observedDays} observed days
            </span>
          </div>
          <ExportButton />
        </div>
      </div>
    </header>
  );
}
