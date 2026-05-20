"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnalyticsResponse, BreakdownItem } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CHART } from "@/lib/chartTheme";
import { formatInr, formatNumber } from "@/lib/utils/format";

type Dimension = "byTaskCategory" | "byApp" | "byDepartment";

const DIMENSIONS: [Dimension, string][] = [
  ["byTaskCategory", "Task"],
  ["byApp", "App"],
  ["byDepartment", "Dept"]
];

export function TimeSinkBreakdown({
  data,
  onDepartmentClick,
  onTaskCategoryClick
}: {
  data: AnalyticsResponse;
  onDepartmentClick: (value: string) => void;
  onTaskCategoryClick: (value: string) => void;
}) {
  const [dimension, setDimension] = useState<Dimension>("byTaskCategory");
  const rows = useMemo(() => data.breakdowns[dimension].slice(0, 12), [data, dimension]);

  function handleClick(item: BreakdownItem) {
    if (dimension === "byDepartment") onDepartmentClick(item.key);
    if (dimension === "byTaskCategory") onTaskCategoryClick(item.key);
  }

  return (
    <Card>
      <SectionHeader
        title="Time-sink breakdown"
        description="Switch dimension. Click department or task bars to filter the dashboard."
        action={
          <div className="pill-toggle">
            {DIMENSIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDimension(key)}
                className={
                  dimension === key
                    ? "flex-1 rounded-lg bg-accent-cyan/15 px-3 py-2 text-xs font-semibold text-accent-cyan shadow-sm sm:flex-none sm:px-4 sm:text-sm"
                    : "flex-1 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:text-foreground sm:flex-none sm:px-4 sm:text-sm"
                }
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 0, right: 4, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="key"
              interval={0}
              angle={-40}
              textAnchor="end"
              height={56}
              tick={{ fontSize: 10, fill: CHART.axis }}
            />
            <YAxis tick={{ fontSize: 11, fill: CHART.axis }} width={36} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${CHART.tooltipBorder}`,
                background: CHART.tooltipBg,
                color: CHART.tooltipText,
                fontSize: 12
              }}
              formatter={(value: number, name: string) => [
                name.includes("Cost") ? formatInr(value) : formatNumber(value, 1),
                name
              ]}
            />
            <Bar
              dataKey="repetitiveHours"
              name="Repetitive hours"
              fill={CHART.cyan}
              radius={[6, 6, 0, 0]}
              onClick={(_, index) => rows[index] && handleClick(rows[index])}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="relative z-[1] mt-2 text-center text-[10px] text-muted sm:text-xs">Tap a bar to apply a cross-filter</p>
    </Card>
  );
}
