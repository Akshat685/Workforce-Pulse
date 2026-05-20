import { AlertTriangle } from "lucide-react";
import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils/format";

export function AnomalyCallout({ data }: { data: AnalyticsResponse }) {
  if (!data.anomaly) return null;
  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-surface to-surface">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/25">
          <AlertTriangle size={22} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <Badge tone="warning" className="mb-2">
            Anomaly callout
          </Badge>
          <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">{data.anomaly.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{data.anomaly.description}</p>
          <p className="mt-3 rounded-xl border border-border bg-canvas/60 px-3 py-2 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-foreground">Metric:</span> {data.anomaly.metric} ·{" "}
            <span className="font-semibold text-foreground">Value:</span> {formatNumber(data.anomaly.value, 4)}. {data.anomaly.reason}
          </p>
        </div>
      </div>
    </Card>
  );
}
