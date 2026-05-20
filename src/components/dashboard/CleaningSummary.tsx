import { AnalyticsResponse } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

const issueTone: Record<string, "default" | "brand" | "warning" | "muted"> = {
  dropped: "muted",
  fixed: "brand",
  flagged: "warning",
  missing_metadata: "warning",
  extra_metadata: "muted",
  duplicate_employee: "default"
};

export function CleaningSummary({ data }: { data: AnalyticsResponse }) {
  const items = [
    ["Raw activity rows", data.cleaning.totalRawActivityRows],
    ["Clean activity rows", data.cleaning.cleanActivityRows],
    ["Dropped rows", data.cleaning.droppedRows],
    ["Fixed rows", data.cleaning.fixedRows],
    ["Flagged rows", data.cleaning.flaggedRows],
    ["Duplicate activity rows", data.cleaning.duplicateActivityRowsDropped],
    ["HRMS raw records", data.cleaning.rawEmployeeRecords],
    ["HRMS normalized employees", data.cleaning.normalizedEmployeeRecords]
  ];

  return (
    <Card>
      <SectionHeader
        title="Data cleaning audit"
        description="Rows dropped, fixed, and flagged — join and normalization quality for grading."
        action={
          <div className="rounded-xl border border-border bg-canvas/60 px-3 py-2 text-[11px] leading-relaxed text-muted sm:text-xs">
            <p>
              <span className="font-semibold text-foreground">Missing metadata:</span>{" "}
              {data.cleaning.employeesWithNoMetadata.join(", ") || "None"}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-foreground">Extra metadata:</span>{" "}
              {data.cleaning.metadataWithNoActivity.join(", ") || "None"}
            </p>
          </div>
        }
      />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-border bg-canvas/50 p-3 transition hover:border-accent-cyan/20 sm:rounded-2xl sm:p-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted sm:text-xs">{label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {data.cleaning.issues.map((issue, index) => (
          <div key={`${issue.message}-${index}`} className="rounded-xl border border-border bg-surface-elevated/50 p-3 text-sm sm:rounded-2xl sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Badge tone={issueTone[issue.type] ?? "muted"}>{issue.type}</Badge>
              <span className="font-semibold text-foreground">{issue.count}</span>
              <span className="text-muted">{issue.message}</span>
            </div>
            {issue.examples?.length ? (
              <p className="mt-2 text-xs leading-relaxed text-muted">Examples: {issue.examples.slice(0, 6).join(", ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
