"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CHART, CHART_PALETTE } from "@/lib/chartTheme";
import { formatPercent } from "@/lib/utils/format";

export function TrendChart({ data }: { data: AnalyticsResponse }) {
  const tasks = Array.from(new Set(data.trends.map((row) => row.taskCategory))).slice(0, 5);
  const weeks = Array.from(new Set(data.trends.map((row) => row.weekStart))).sort();
  const chartData = weeks.map((weekStart) => {
    const item: Record<string, string | number> = { weekStart: weekStart.slice(5) };
    tasks.forEach((task) => {
      const match = data.trends.find((row) => row.weekStart === weekStart && row.taskCategory === task);
      item[task] = match ? Math.round(match.repetitiveShare * 1000) / 10 : 0;
    });
    return item;
  });

  return (
    <Card className="h-full">
      <SectionHeader
        title="Week-over-week repetitive share"
        description="Top task categories — repetitive share by week."
      />
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="weekStart" tick={{ fontSize: 10, fill: CHART.axis }} />
            <YAxis tick={{ fontSize: 11, fill: CHART.axis }} width={36} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${CHART.tooltipBorder}`,
                background: CHART.tooltipBg,
                color: CHART.tooltipText,
                fontSize: 12
              }}
              formatter={(value: number) => formatPercent(value / 100)}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: CHART.axis }} />
            {tasks.map((task, index) => (
              <Line
                key={task}
                type="monotone"
                dataKey={task}
                stroke={CHART_PALETTE[index % CHART_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_PALETTE[index % CHART_PALETTE.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
