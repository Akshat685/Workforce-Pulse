"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, Clock, IndianRupee, Info, Repeat, Target } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";
import { Tooltip } from "@/components/ui/Tooltip";
import { HeadlineAudit } from "./HeadlineAudit";

type CardKey = "hours" | "inr" | "share" | "top";

const cards: Array<{ key: CardKey; icon: typeof Clock; accent: "cyan" | "emerald"; glow: string }> = [
  { key: "hours", icon: Clock, accent: "cyan", glow: "kpi-glow-cyan" },
  { key: "inr", icon: IndianRupee, accent: "emerald", glow: "kpi-glow-emerald" },
  { key: "share", icon: Repeat, accent: "cyan", glow: "" },
  { key: "top", icon: Target, accent: "emerald", glow: "" }
];

export function HeadlineCards({
  data,
  onOpenMethodology
}: {
  data: AnalyticsResponse;
  onOpenMethodology: () => void;
}) {
  const [openAudit, setOpenAudit] = useState<CardKey | null>(null);
  const top = data.automationRanking[0];
  const multiplier = formatNumber(data.dateRange.monthlyMultiplier, 3);

  const items: Array<{
    label: string;
    value: string;
    hint: string;
    compact?: boolean;
    showMethodology?: boolean;
    tooltip?: ReactNode;
  }> = [
    {
      label: "Recoverable hours / month",
      value: formatNumber(data.headlines.recoverableHoursMonthly, 1),
      hint: `Scaled by ${formatNumber(data.dateRange.monthlyMultiplier, 2)}× from observed range.`,
      showMethodology: true,
      tooltip: (
        <>
          <strong className="text-foreground">Formula:</strong> Σ(repetitive hours × per-task recoverability factor) ×{" "}
          {multiplier}× monthly multiplier.
          <br />
          <br />
          Not a flat 60% — factors vary by task (see methodology drawer).
        </>
      )
    },
    {
      label: "Recoverable INR / month",
      value: formatInr(data.headlines.recoverableCostMonthlyInr),
      hint: `HRMS hourly rates · ${formatPercent(data.headlines.costCoverageShare)} cost coverage.`,
      showMethodology: true,
      tooltip: (
        <>
          <strong className="text-foreground">Formula:</strong> Σ(repetitive task cost × recoverability factor) × {multiplier}×.
          <br />
          <br />
          Task cost = duration hours × employee hourly rate from joined HRMS. Rows without compensation are excluded from INR.
        </>
      )
    },
    {
      label: "Repetitive work share",
      value: formatPercent(data.headlines.repetitiveShare),
      hint: `${formatNumber(data.headlines.repetitiveHours, 1)} repetitive of ${formatNumber(data.headlines.totalHours, 1)} total hours.`
    },
    {
      label: "Top automation candidate",
      value: top?.taskCategory ?? "—",
      hint: top ? `Score ${formatNumber(top.score, 1)} · ${formatInr(top.estimatedRecoverableCostMonthlyInr)}/mo` : "—",
      compact: true
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {items.map((item, index) => {
        const meta = cards[index];
        const Icon = meta.icon;
        const iconColor = meta.accent === "cyan" ? "text-accent-cyan" : "text-accent-emerald";
        const iconBg = meta.accent === "cyan" ? "bg-accent-cyan/10 ring-accent-cyan/20" : "bg-accent-emerald/10 ring-accent-emerald/20";
        const isOpen = openAudit === meta.key;
        const canAudit = meta.key !== "top" || Boolean(top);

        return (
          <article
            key={item.label}
            className={`group relative overflow-visible rounded-2xl border border-border bg-surface p-4 shadow-card transition hover:border-accent-cyan/20 hover:shadow-card-hover sm:p-5 ${meta.glow}`}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
              <div
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${
                  meta.accent === "cyan" ? "bg-accent-cyan/10" : "bg-accent-emerald/10"
                }`}
              />
            </div>
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted sm:text-sm">
                {item.label}
                {item.tooltip ? (
                  <Tooltip content={item.tooltip}>
                    <button
                      type="button"
                      className="rounded-md p-0.5 text-muted transition hover:bg-accent-cyan/10 hover:text-accent-cyan"
                      aria-label={`${item.label} methodology`}
                    >
                      <Info size={14} aria-hidden />
                    </button>
                  </Tooltip>
                ) : null}
              </p>
              <div className={`rounded-xl p-2 ring-1 ${iconBg}`}>
                <Icon size={16} className={iconColor} aria-hidden />
              </div>
            </div>
            <p
              className={`relative mt-3 font-semibold tracking-tight text-foreground ${
                item.compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
              }`}
            >
              {item.value}
            </p>
            <p className="relative mt-2 text-[11px] leading-relaxed text-muted sm:text-xs">{item.hint}</p>
            <div className="relative mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {item.showMethodology ? (
                <button
                  type="button"
                  onClick={onOpenMethodology}
                  className="text-[11px] font-medium text-accent-cyan underline-offset-2 hover:underline sm:text-xs"
                >
                  View full methodology →
                </button>
              ) : null}
              {canAudit ? (
                <button
                  type="button"
                  onClick={() => setOpenAudit(isOpen ? null : meta.key)}
                  aria-expanded={isOpen}
                  aria-controls={`headline-audit-${meta.key}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted underline-offset-2 transition hover:text-accent-cyan hover:underline sm:text-xs"
                >
                  <ChevronDown
                    size={12}
                    aria-hidden
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  {isOpen ? "Hide source rows" : "Where does this come from?"}
                </button>
              ) : null}
            </div>
            {isOpen ? (
              <div id={`headline-audit-${meta.key}`} className="relative">
                <HeadlineAudit kind={meta.key} data={data} />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
