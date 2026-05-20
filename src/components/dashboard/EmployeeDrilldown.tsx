"use client";

import { User } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";

export function EmployeeDrilldown({
  data,
  employeeId,
  onEmployeeChange,
  activeTaskFilter
}: {
  data: AnalyticsResponse;
  employeeId?: string;
  onEmployeeChange: (employeeId?: string) => void;
  activeTaskFilter?: string;
}) {
  const selected = data.employees.find((employee) => employee.employeeId === employeeId) ?? data.employees[0];

  return (
    <Card className="h-full">
      <SectionHeader
        title="Employee drill-down"
        description={
          activeTaskFilter
            ? `Filtered to employees with activity in “${activeTaskFilter}”. Click a task in Automation ranking to cross-filter.`
            : "Profile, top repetitive tasks, and peer comparison by role. Click a task category elsewhere to filter this list."
        }
        action={
          <Select
            className="sm:min-w-[220px]"
            value={selected?.employeeId ?? ""}
            onChange={(event) => onEmployeeChange(event.target.value || undefined)}
          >
            {data.employees.map((employee) => (
              <option key={employee.employeeId} value={employee.employeeId}>
                {employee.employeeId} · {employee.role ?? "Unknown role"}
              </option>
            ))}
          </Select>
        }
      />
      {selected ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-canvas/50 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-emerald/20 text-accent-cyan ring-1 ring-accent-cyan/25">
                <User size={20} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold text-foreground sm:text-2xl">{selected.employeeId}</p>
                <p className="truncate text-sm text-muted">
                  {selected.department} · {selected.role ?? "Unknown role"}
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Total hours", formatNumber(selected.totalHours, 1)],
                ["Repetitive hours", formatNumber(selected.repetitiveHours, 1)],
                ["Repetitive share", formatPercent(selected.repetitiveShare)],
                ["Total cost", formatInr(selected.totalCostInr)]
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-3 text-xs leading-relaxed text-muted">
              Peer comparison: role avg {formatPercent(selected.peerComparison.roleAverageRepetitiveShare)} · difference{" "}
              <span className="text-accent-cyan">{formatPercent(selected.peerComparison.differenceFromRoleAverage)}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border p-4 sm:p-5">
            <p className="font-semibold text-foreground">Top tasks</p>
            <div className="mt-3 space-y-3">
              {selected.topTasks.map((task) => (
                <div key={task.taskCategory}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-foreground">{task.taskCategory}</span>
                    <span className="shrink-0 text-muted">{formatNumber(task.repetitiveHours, 1)} rep. hrs</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald"
                      style={{ width: `${Math.min(100, (task.repetitiveHours / Math.max(1, selected.repetitiveHours)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-border bg-canvas/50 p-4 text-sm text-muted">
          No employee rows match the current filters.
        </p>
      )}
    </Card>
  );
}
