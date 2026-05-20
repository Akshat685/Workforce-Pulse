"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CHART } from "@/lib/chartTheme";
import { formatNumber, formatPercent } from "@/lib/utils/format";

export function DepartmentRepetitiveChart({
  data,
  onDepartmentClick
}: {
  data: AnalyticsResponse;
  onDepartmentClick: (department: string) => void;
}) {
  const rows = data.breakdowns.byDepartment
    .slice(0, 10)
    .map((item) => ({
      name: item.key,
      repetitiveHours: item.repetitiveHours,
      share: item.totalHours > 0 ? item.repetitiveHours / item.totalHours : 0
    }));

  return (
    <Card className="h-full">
      <SectionHeader
        title="Repetitive work by department"
        description="Repetitive hours concentration across departments."
      />
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-35}
              textAnchor="end"
              height={52}
              tick={{ fontSize: 10, fill: CHART.axis }}
            />
            <YAxis tick={{ fontSize: 11, fill: CHART.axis }} width={40} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${CHART.tooltipBorder}`,
                background: CHART.tooltipBg,
                color: CHART.tooltipText,
                fontSize: 12
              }}
              formatter={(value: number, _name, props) => {
                const payload = props?.payload as { share?: number } | undefined;
                return [
                  `${formatNumber(value, 1)} hrs (${formatPercent(payload?.share ?? 0)})`,
                  "Repetitive hours"
                ];
              }}
            />
            <Bar
              dataKey="repetitiveHours"
              name="Repetitive hours"
              fill={CHART.cyan}
              radius={[6, 6, 0, 0]}
              onClick={(entry) => entry?.name && onDepartmentClick(String(entry.name))}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="relative z-[1] mt-2 text-center text-[10px] text-muted sm:text-xs">Click a bar to filter by department</p>
    </Card>
  );
}
