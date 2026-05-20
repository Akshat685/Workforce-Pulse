import { AnalyticsResponse } from "@/lib/data/types";
import { RECOVERABILITY_FACTORS } from "@/lib/data/constants";
import { formatNumber, formatPercent } from "@/lib/utils/format";

export function MethodologyContent({
  data,
  showAllFactors = false
}: {
  data: AnalyticsResponse;
  showAllFactors?: boolean;
}) {
  const factors = Object.entries(RECOVERABILITY_FACTORS)
    .filter(([key]) => key !== "Unknown Task")
    .sort((a, b) => b[1] - a[1]);
  const displayedFactors = showAllFactors ? factors : factors.slice(0, 8);

  return (
    <div className="space-y-5 text-sm text-muted">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Recoverable headline formula</h3>
        <p className="mt-2 leading-relaxed">{data.headlines.methodology}</p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-canvas/80 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
          {`recoverable hours/mo = Σ(repetitive hrs × task recoverability) × (30 ÷ observed days)
recoverable INR/mo   = Σ(repetitive cost × task recoverability) × (30 ÷ observed days)
repetitive cost      = duration hrs × employee hourly rate (joined HRMS)`}
        </pre>
        <p className="mt-2 text-xs">
          This is <span className="font-semibold text-foreground">not</span> a flat “repetitive minutes × 0.6”. Each task uses a
          documented automation-feasibility factor (typically 15%–70%).
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-canvas/50 p-3 sm:p-4">
          <h3 className="font-semibold text-foreground">Scaling</h3>
          <p className="mt-1 text-xs leading-relaxed">
            Observed range: {data.dateRange.start ?? "—"} to {data.dateRange.end ?? "—"} ({data.dateRange.observedDays} days).
            Monthly multiplier: {formatNumber(data.dateRange.monthlyMultiplier, 3)}× (30 ÷ observed days).
          </p>
        </section>
        <section className="rounded-2xl border border-border bg-canvas/50 p-3 sm:p-4">
          <h3 className="font-semibold text-foreground">INR basis (HRMS join)</h3>
          <p className="mt-1 text-xs leading-relaxed">
            Hourly rate from joined HRMS (annual CTC, LPA, or hourly fields). Task cost = duration hours × hourly rate. Rows
            without compensation are excluded from INR totals but remain in hour totals. Cost coverage:{" "}
            {formatPercent(data.headlines.costCoverageShare)}.
          </p>
        </section>
      </div>

      <section>
        <h3 className="font-semibold text-foreground">Automation priority score</h3>
        <p className="mt-1 text-xs leading-relaxed">
          Score = 35% normalized repetitive-hour volume + 30% normalized recoverable INR + 20% employee spread (people doing
          the task ÷ workforce) + 15% repetitiveness rate. Higher spread favors tasks many employees share — easier to
          automate once for everyone.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground">Task recoverability factors</h3>
        <p className="mt-1 text-xs">Per-task automation feasibility applied to repetitive work only.</p>
        <ul className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
          {displayedFactors.map(([task, factor]) => (
            <li key={task} className="rounded-xl border border-border bg-surface-elevated px-2.5 py-1.5">
              {task}: <span className="font-semibold text-accent-cyan">{formatPercent(factor)}</span>
            </li>
          ))}
        </ul>
        {!showAllFactors && factors.length > 8 ? (
          <p className="mt-2 text-xs text-muted">Open the full methodology drawer to see all {factors.length} factors.</p>
        ) : null}
      </section>
    </div>
  );
}
