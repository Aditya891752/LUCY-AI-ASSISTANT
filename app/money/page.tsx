export default function MoneyPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
          Financial Discipline
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Money & Year-End
        </h1>
      </header>

      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Monthly Spend Limit</span>
          <span className="text-foreground font-semibold tabular-nums">$0 / $0</span>
        </div>
        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
          <div className="bg-accent h-full w-0" />
        </div>
        <p className="text-xs text-muted-foreground">
          Tracks budgets and runway so Lucy&apos;s diet and supplement suggestions respect your financial reality.
        </p>
      </div>
    </div>
  );
}
