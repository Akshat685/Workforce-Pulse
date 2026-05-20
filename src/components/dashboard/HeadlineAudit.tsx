"use client";

import { AnalyticsResponse } from "@/lib/data/types";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";

type AuditKind = "hours" | "inr" | "share" | "top";

export function HeadlineAudit({ kind, data }: { kind: AuditKind; data: AnalyticsResponse }) {
  if (kind === "hours") return <HoursAudit data={data} />;
  if (kind === "inr") return <InrAudit data={data} />;
  if (kind === "share") return <ShareAudit data={data} />;
  return <TopAudit data={data} />;
}

function AuditFrame({ title, children, total }: { title: string; children: React.ReactNode; total?: string }) {
  return (
    <div className="mt-3 rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-3 text-[11px] leading-relaxed sm:text-xs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-wide text-accent-cyan">{title}</p>
        {total ? <span className="font-mono text-foreground">{total}</span> : null}
      </div>
      {children}
    </div>
  );
}

function HoursAudit({ data }: { data: AnalyticsResponse }) {
  const rows = [...data.automationRanking]
    .sort((a, b) => b.estimatedRecoverableHoursMonthly - a.estimatedRecoverableHoursMonthly)
    .slice(0, 5);
  const sum = rows.reduce((acc, row) => acc + row.estimatedRecoverableHoursMonthly, 0);
  return (
    <AuditFrame
      title="Top 5 contributing tasks"
      total={`${formatNumber(sum, 1)} of ${formatNumber(data.headlines.recoverableHoursMonthly, 1)} hrs/mo`}
    >
      <table className="w-full text-left">
        <thead className="text-muted">
          <tr>
            <th className="pb-1 font-medium">Task</th>
            <th className="pb-1 text-right font-medium">Rep. hrs</th>
            <th className="pb-1 text-right font-medium">Hrs/mo</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.taskCategory} className="border-t border-border/40">
              <td className="py-1 pr-2 font-sans text-foreground">{row.taskCategory}</td>
              <td className="py-1 text-right text-muted">{formatNumber(row.repetitiveHours, 1)}</td>
              <td className="py-1 text-right text-foreground">{formatNumber(row.estimatedRecoverableHoursMonthly, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-muted">
        Each task: repetitive hours × per-task recoverability factor × {formatNumber(data.dateRange.monthlyMultiplier, 2)}× monthly
        multiplier.
      </p>
    </AuditFrame>
  );
}

function InrAudit({ data }: { data: AnalyticsResponse }) {
  const rows = [...data.automationRanking]
    .sort((a, b) => b.estimatedRecoverableCostMonthlyInr - a.estimatedRecoverableCostMonthlyInr)
    .slice(0, 5);
  const sum = rows.reduce((acc, row) => acc + row.estimatedRecoverableCostMonthlyInr, 0);
  return (
    <AuditFrame
      title="Top 5 contributing tasks"
      total={`${formatInr(sum)} of ${formatInr(data.headlines.recoverableCostMonthlyInr)}/mo`}
    >
      <table className="w-full text-left">
        <thead className="text-muted">
          <tr>
            <th className="pb-1 font-medium">Task</th>
            <th className="pb-1 text-right font-medium">Rep. hrs</th>
            <th className="pb-1 text-right font-medium">INR/mo</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.taskCategory} className="border-t border-border/40">
              <td className="py-1 pr-2 font-sans text-foreground">{row.taskCategory}</td>
              <td className="py-1 text-right text-muted">{formatNumber(row.repetitiveHours, 1)}</td>
              <td className="py-1 text-right text-foreground">{formatInr(row.estimatedRecoverableCostMonthlyInr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-muted">
        Cost = duration × employee hourly rate (from joined HRMS). Coverage:{" "}
        {formatPercent(data.headlines.costCoverageShare)} of hours have a compensation basis.
      </p>
    </AuditFrame>
  );
}

function ShareAudit({ data }: { data: AnalyticsResponse }) {
  const rows = [...data.breakdowns.byTaskCategory]
    .sort((a, b) => b.repetitiveHours - a.repetitiveHours)
    .slice(0, 5);
  return (
    <AuditFrame
      title="Top 5 repetitive tasks (raw hours)"
      total={`${formatNumber(data.headlines.repetitiveHours, 1)} of ${formatNumber(data.headlines.totalHours, 1)} hrs`}
    >
      <table className="w-full text-left">
        <thead className="text-muted">
          <tr>
            <th className="pb-1 font-medium">Task</th>
            <th className="pb-1 text-right font-medium">Rep. hrs</th>
            <th className="pb-1 text-right font-medium">Total hrs</th>
            <th className="pb-1 text-right font-medium">Share</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border/40">
              <td className="py-1 pr-2 font-sans text-foreground">{row.key}</td>
              <td className="py-1 text-right text-muted">{formatNumber(row.repetitiveHours, 1)}</td>
              <td className="py-1 text-right text-muted">{formatNumber(row.totalHours, 1)}</td>
              <td className="py-1 text-right text-foreground">
                {row.totalHours > 0 ? formatPercent(row.repetitiveHours / row.totalHours) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-muted">Share = repetitive hours / total observed hours across all rows passing cleaning.</p>
    </AuditFrame>
  );
}

function TopAudit({ data }: { data: AnalyticsResponse }) {
  const top = data.automationRanking[0];
  if (!top) return null;
  return (
    <AuditFrame title="Score breakdown" total={`Score ${formatNumber(top.score, 1)}`}>
      <p className="text-muted">{top.formulaExplanation}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 font-mono">
        <div className="rounded-lg border border-border bg-canvas/40 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted">Repetitive hours</dt>
          <dd className="mt-0.5 text-foreground">{formatNumber(top.repetitiveHours, 1)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-canvas/40 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted">Recoverable INR/mo</dt>
          <dd className="mt-0.5 text-foreground">{formatInr(top.estimatedRecoverableCostMonthlyInr)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-canvas/40 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted">Employees on task</dt>
          <dd className="mt-0.5 text-foreground">{top.employeeCount}</dd>
        </div>
        <div className="rounded-lg border border-border bg-canvas/40 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted">Repetitiveness rate</dt>
          <dd className="mt-0.5 text-foreground">{formatPercent(top.repetitiveShare)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-muted">Score = 35% hrs volume + 30% recoverable INR + 20% employee spread + 15% repetitiveness rate.</p>
    </AuditFrame>
  );
}
