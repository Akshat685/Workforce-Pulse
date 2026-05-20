"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info, PanelRightOpen } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { MethodologyContent } from "./MethodologyContent";
import { Button } from "@/components/ui/Button";

export function MethodologyPanel({
  data,
  onOpenDrawer
}: {
  data: AnalyticsResponse;
  onOpenDrawer: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="rounded-lg bg-accent-cyan/10 p-1.5 text-accent-cyan ring-1 ring-accent-cyan/20">
            <Info size={16} aria-hidden />
          </span>
          How headline numbers are calculated
        </span>
        <Button type="button" variant="outline" onClick={onOpenDrawer} className="w-full sm:w-auto">
          <PanelRightOpen size={16} aria-hidden /> Open methodology drawer
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-muted transition hover:bg-white/[0.03] sm:px-5"
        aria-expanded={open}
      >
        <span>{open ? "Collapse details" : "Expand details (click-to-expand)"}</span>
        {open ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-4 sm:px-5">
          <MethodologyContent data={data} />
        </div>
      ) : null}
    </div>
  );
}
