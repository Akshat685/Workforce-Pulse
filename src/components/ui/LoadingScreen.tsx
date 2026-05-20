import { Loader2 } from "lucide-react";

export function LoadingScreen({ message = "Loading Workforce Pulse…" }: { message?: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas p-4">
      <div className="glass-card flex max-w-sm flex-col items-center gap-4 px-8 py-10 text-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent-cyan/20 blur-xl animate-pulse-soft" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan to-brand-600 text-canvas shadow-glow">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{message}</p>
          <p className="mt-1 text-xs text-muted">Cleaning data and computing analytics…</p>
        </div>
      </div>
    </main>
  );
}
