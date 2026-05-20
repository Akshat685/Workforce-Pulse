export function ChartSkeleton() {
  const heights = [40, 65, 50, 80, 55, 70, 45, 60];
  return (
    <div className="chart-wrap animate-pulse rounded-xl border border-border bg-surface-elevated/50">
      <div className="flex h-full flex-col justify-end gap-2 p-4">
        <div className="flex h-3/4 items-end justify-around gap-2">
          {heights.map((h, i) => (
            <div key={i} className="w-full max-w-8 rounded-t-md bg-border" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
