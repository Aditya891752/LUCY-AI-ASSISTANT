export default function PlanPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
          Tactical Execution Board
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Winter Arc Plan
        </h1>
      </header>

      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Weekly Protocol</h2>
        <p className="text-xs text-muted-foreground">
          Synthesizes your profile biometrics, past 2-4 weeks of tracking history, budget limits, and personal notes into an actionable weekly board.
        </p>
        <button className="w-full bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded-md hover:bg-accent/90 active:scale-98 transition-transform">
          Generate Weekly Plan
        </button>
      </div>
    </div>
  );
}
