import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`glass-card p-4 sm:p-5 lg:p-6 ${className}`}>
      <div className="relative z-[1]">{children}</div>
    </section>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-base font-semibold tracking-tight text-foreground sm:text-lg ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-xs leading-relaxed text-muted sm:text-sm ${className}`}>{children}</p>;
}
