import { ReactNode } from "react";

type Tone = "default" | "brand" | "warning" | "success" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-foreground/10 text-foreground ring-1 ring-border",
  brand: "bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/25",
  warning: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/25",
  success: "bg-accent-emerald/10 text-accent-emerald ring-1 ring-accent-emerald/25",
  muted: "bg-white/[0.04] text-muted ring-1 ring-border"
};

export function Badge({ children, tone = "default", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
