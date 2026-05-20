import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";

export function AutomationRanking({
  data,
  onTaskCategoryClick
}: {
  data: AnalyticsResponse;
  onTaskCategoryClick: (value: string) => void;
}) {
  return (
    <Card>
      <SectionHeader
        title="Automation priority ranking"
        description="Volume, recoverable INR, employee spread, and repetitiveness."
        action={
          <p className="rounded-xl border border-border bg-canvas/60 px-3 py-2 text-[10px] leading-relaxed text-muted sm:max-w-xs sm:text-xs">
            Score = 35% repetitive-hour volume + 30% recoverable INR + 20% employee spread + 15% repetitiveness rate.
          </p>
        }
      />
      <div className="data-table-wrap scrollbar-thin">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Score</th>
              <th className="hidden sm:table-cell">Hrs/mo</th>
              <th>INR/mo</th>
              <th className="hidden md:table-cell">People</th>
              <th className="hidden lg:table-cell">Rep. share</th>
            </tr>
          </thead>
          <tbody>
            {data.automationRanking.slice(0, 10).map((row, index) => (
              <tr key={row.taskCategory}>
                <td className="font-semibold text-foreground">{index + 1}</td>
                <td>
                  <button
                    type="button"
                    className="max-w-[120px] truncate font-medium text-accent-cyan underline-offset-2 hover:underline sm:max-w-none"
                    onClick={() => onTaskCategoryClick(row.taskCategory)}
                  >
                    {row.taskCategory}
                  </button>
                </td>
                <td>
                  <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-accent-cyan/10 px-2 py-0.5 text-sm font-semibold text-accent-cyan">
                    {formatNumber(row.score, 1)}
                  </span>
                </td>
                <td className="hidden sm:table-cell text-muted">{formatNumber(row.estimatedRecoverableHoursMonthly, 1)}</td>
                <td className="font-medium text-accent-emerald">{formatInr(row.estimatedRecoverableCostMonthlyInr)}</td>
                <td className="hidden md:table-cell text-muted">{row.employeeCount}</td>
                <td className="hidden lg:table-cell text-muted">{formatPercent(row.repetitiveShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
