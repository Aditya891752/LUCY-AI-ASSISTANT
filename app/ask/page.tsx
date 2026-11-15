import { ShieldCheck } from "lucide-react";

export default function AskPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
            Permanent Memory Core
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ask Your Data
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-2 border border-border px-3 py-1 rounded-full text-xs font-semibold text-success">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Only</span>
        </div>
      </header>

      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          Lucy answers questions strictly from your stored database rows. Every answer passes through an independent verifier check before display.
        </p>
        <div className="text-xs text-foreground bg-surface-2 p-2.5 rounded border border-border">
          Try asking: <span className="text-accent">&quot;What did I eat yesterday?&quot;</span> or <span className="text-accent">&quot;How many workouts have I completed this week?&quot;</span>
        </div>
      </div>
    </div>
  );
}
