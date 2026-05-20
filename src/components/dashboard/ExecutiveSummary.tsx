import { AnalyticsResponse, DashboardFilters } from "@/lib/data/types";
import { getActiveFilterRows } from "@/lib/utils/exportFilters";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";

const TOP_OPPORTUNITIES = 5;

export function ExecutiveSummary({ data, filters }: { data: AnalyticsResponse; filters: DashboardFilters }) {
  const activeFilters = getActiveFilterRows(filters, data.employees);

  const kpis = [
    {
      label: "Recoverable hours / month",
      value: formatNumber(data.headlines.recoverableHoursMonthly, 1),
      tone: "teal" as const
    },
    {
      label: "Recoverable INR / month",
      value: formatInr(data.headlines.recoverableCostMonthlyInr),
      tone: "emerald" as const
    },
    {
      label: "Repetitive work share",
      value: formatPercent(data.headlines.repetitiveShare),
      tone: "violet" as const
    }
  ];

  const kpiToneClasses = {
    teal: "border border-teal-300 bg-teal-100",
    emerald: "border border-emerald-300 bg-emerald-100",
    violet: "border border-violet-300 bg-violet-100"
  };

  return (
    <Card>
      <SectionHeader title="Executive summary" description="Export-ready snapshot — respects active filters." />
      <div className="mt-4 overflow-x-auto">
        <div id="executive-summary-export" className="inline-block bg-white p-3">
          <div className="box-border w-[960px] max-w-none rounded-2xl border-2 border-slate-400 bg-white p-8 text-slate-950">
        <header className="grid grid-cols-[1fr_auto] gap-6 border-b-2 border-slate-300 pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-900">Workforce Pulse</p>
            <h2 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-slate-950">Executive summary</h2>
            <p className="mt-2 text-sm font-medium text-slate-800">
              Recoverable hours, INR impact, and automation priorities from activity logs × HRMS.
            </p>
          </div>
          <dl className="min-w-[280px] space-y-2 text-sm text-slate-950">
            <div className="grid grid-cols-[108px_1fr] gap-x-3 gap-y-1">
              <dt className="font-bold text-slate-800">Date range</dt>
              <dd className="font-semibold">
                {data.dateRange.start ?? "—"} → {data.dateRange.end ?? "—"}
              </dd>
              <dt className="font-bold text-slate-800">Observed days</dt>
              <dd className="font-semibold">
                {data.dateRange.observedDays} days · {formatNumber(data.dateRange.monthlyMultiplier, 3)}× monthly scale
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Active filters</h3>
          {activeFilters.length > 0 ? (
            <div data-export-overflow className="mt-2 overflow-visible rounded-xl border-2 border-slate-300">
              <table className="w-full border-collapse text-sm text-slate-950">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-200 text-left text-[11px] font-bold uppercase tracking-wide text-slate-900">
                    <th className="w-[200px] px-4 py-2.5">Filter</th>
                    <th className="px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFilters.map((filter) => (
                    <tr key={filter.label} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{filter.label}</td>
                      <td className="px-4 py-2.5 font-semibold break-words text-slate-950">{filter.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-800">No filters applied</p>
          )}
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Headline metrics</h3>
          <div className="mt-3 grid grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <article key={kpi.label} className={`rounded-2xl p-4 ${kpiToneClasses[kpi.tone]}`}>
                <p className="text-sm font-bold text-slate-800">{kpi.label}</p>
                <p className="mt-2 text-[28px] font-bold leading-none text-slate-950">{kpi.value}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-800">
            Cost coverage for INR: {formatPercent(data.headlines.costCoverageShare)} · Total observed hours:{" "}
            {formatNumber(data.headlines.totalHours, 1)} ({formatNumber(data.headlines.repetitiveHours, 1)} repetitive)
          </p>
        </section>

        <section className="mt-6">
          <h3 className="text-base font-bold text-slate-950">Top {TOP_OPPORTUNITIES} automation opportunities</h3>
          <div data-export-overflow className="mt-3 overflow-visible rounded-xl border-2 border-slate-300">
            <table className="w-full table-fixed border-collapse text-[13px] leading-snug text-slate-950">
              <colgroup>
                <col className="w-[52px]" />
                <col className="w-[34%]" />
                <col className="w-[72px]" />
                <col className="w-[88px]" />
                <col className="w-[120px]" />
                <col className="w-[80px]" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-200 text-left text-[11px] font-bold uppercase tracking-wide text-slate-900">
                  <th className="px-3 py-2.5">Rank</th>
                  <th className="px-3 py-2.5">Task</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Hrs / mo</th>
                  <th className="px-3 py-2.5">INR / mo</th>
                  <th className="px-3 py-2.5 text-right">People</th>
                </tr>
              </thead>
              <tbody>
                {data.automationRanking.slice(0, TOP_OPPORTUNITIES).map((row, index) => (
                  <tr key={row.taskCategory} className="border-b border-slate-200 align-top">
                    <td className="px-3 py-2.5 font-bold text-slate-950">{index + 1}</td>
                    <td className="px-3 py-2.5 font-semibold break-words text-slate-950">{row.taskCategory}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{formatNumber(row.score, 1)}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{formatNumber(row.estimatedRecoverableHoursMonthly, 1)}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-950">{formatInr(row.estimatedRecoverableCostMonthlyInr)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{row.employeeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

          </div>
        </div>
      </div>
    </Card>
  );
}
