"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { MethodologyContent } from "./MethodologyContent";

export function MethodologyDrawer({
  open,
  onClose,
  data
}: {
  open: boolean;
  onClose: () => void;
  data: AnalyticsResponse;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        aria-label="Close methodology drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="section-label text-accent-cyan">Methodology</p>
            <h2 id="methodology-drawer-title" className="text-lg font-semibold text-foreground">
              How numbers are calculated
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted transition hover:bg-white/[0.04] hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">
          <MethodologyContent data={data} showAllFactors />
        </div>
      </aside>
    </div>
  );
}
