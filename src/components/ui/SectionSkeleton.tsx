import { Card } from "./Card";

export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <div className="h-5 w-48 animate-pulse rounded-lg bg-border" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-elevated" />
        ))}
      </div>
    </Card>
  );
}
