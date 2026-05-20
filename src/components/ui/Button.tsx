import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent-cyan to-brand-500 text-canvas shadow-md shadow-accent-cyan/20 hover:from-brand-300 hover:to-brand-400 hover:shadow-lg hover:shadow-accent-cyan/25",
  secondary: "border border-border bg-surface-elevated text-foreground hover:bg-white/[0.06]",
  ghost: "bg-transparent text-muted hover:bg-white/[0.04] hover:text-foreground",
  outline:
    "border border-border bg-transparent text-foreground hover:border-accent-cyan/40 hover:bg-accent-cyan/5"
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-cyan disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${variants[variant]} ${className}`}
    />
  );
}
