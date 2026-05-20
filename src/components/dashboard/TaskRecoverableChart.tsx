"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CHART } from "@/lib/chartTheme";
import { formatInr } from "@/lib/utils/format";

export function TaskRecoverableChart({
  data,
  onTaskCategoryClick
}: {
  data: AnalyticsResponse;
  onTaskCategoryClick: (task: string) => void;
}) {
  const rows = data.breakdowns.byTaskCategory
    .slice()
    .sort((a, b) => b.recoverableCostMonthlyInr - a.recoverableCostMonthlyInr)
    .slice(0, 10)
    .map((item) => ({
      name: item.key,
      recoverableInr: item.recoverableCostMonthlyInr
    }));

  return (
    <Card className="h-full">
      <SectionHeader
        title="Recoverable INR by task"
        description="Monthly recoverable cost potential by task category."
      />
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" tick={{ fontSize: 10, fill: CHART.axis }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 10, fill: CHART.axis }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${CHART.tooltipBorder}`,
                background: CHART.tooltipBg,
                color: CHART.tooltipText,
                fontSize: 12
              }}
              formatter={(value: number) => [formatInr(value), "Recoverable / mo"]}
            />
            <Bar
              dataKey="recoverableInr"
              name="Recoverable INR/mo"
              fill={CHART.emerald}
              radius={[0, 6, 6, 0]}
              onClick={(entry) => entry?.name && onTaskCategoryClick(String(entry.name))}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="relative z-[1] mt-2 text-center text-[10px] text-muted sm:text-xs">Click a bar to filter by task</p>
    </Card>
  );
}
