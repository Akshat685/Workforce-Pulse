import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative w-full ${className}`}>
      <select
        {...props}
        className="w-full appearance-none rounded-xl border border-border bg-surface-elevated px-3 py-2.5 pr-9 text-sm text-foreground shadow-sm transition focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}
