"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Shield, Target, Plus, Check, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getMoneyData, logTransaction, setBudget } from "@/lib/actions/money";
import { FinanceSummary, TransactionItem, BudgetLimit } from "@/lib/calc/finance";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Groceries & Nutrition",
  "Fitness & Supplements",
  "Living & Utilities",
  "Discretionary",
  "Salary",
  "Investment",
];

export default function MoneyPage() {
  const [data, setData] = useState<{
    summary: FinanceSummary;
    transactions: TransactionItem[];
    budgets: BudgetLimit[];
    goal: { name: string; target: number; deadline?: string };
  } | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const loadData = async () => {
    const res = await getMoneyData();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    setIsSubmitting(true);
    await logTransaction({
      amount: val,
      type,
      category,
      note: note.trim() || undefined,
    });

    setAmount("");
    setNote("");
    setIsAdding(false);
    setIsSubmitting(false);
    loadData();
  };

  const summary = data?.summary;
  const filteredTransactions = data?.transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <header className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
            Financial Discipline
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Money & Year-End
          </h1>
        </div>
        <button
          onClick={() => setIsAdding((prev) => !prev)}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded hover:bg-accent/90 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Entry</span>
        </button>
      </header>

      {/* QUICK LOG FORM */}
      {isAdding && (
        <form onSubmit={handleAddTransaction} className="bg-surface-1 border border-accent/40 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Record Ground-Truth Inflow / Outflow
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "py-2 rounded text-xs font-semibold border transition-colors",
                type === "expense"
                  ? "bg-danger text-white border-danger"
                  : "bg-surface-2 border-border text-foreground hover:border-border-active"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "py-2 rounded text-xs font-semibold border transition-colors",
                type === "income"
                  ? "bg-success text-white border-success"
                  : "bg-surface-2 border-border text-foreground hover:border-border-active"
              )}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="45.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded p-2 text-xs text-foreground focus:border-accent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Description / Note</label>
            <input
              type="text"
              placeholder="e.g. Grass-fed beef, whey, gym dues..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded p-2 text-xs text-foreground focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded hover:bg-accent/90 active:scale-98 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? "Recording..." : "Save Transaction"}
          </button>
        </form>
      )}

      {/* FINANCIAL OVERVIEW & YEAR-END RUNWAY */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface-1 border border-border rounded-lg p-3.5 space-y-1">
          <span className="text-[11px] text-muted-foreground block">Net Monthly Savings</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-foreground">
              ${summary?.net_savings.toLocaleString() || "0"}
            </span>
          </div>
          <span className="text-[10px] text-success font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {summary?.savings_rate_pct || 0}% Savings Rate
          </span>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-3.5 space-y-1">
          <span className="text-[11px] text-muted-foreground block">Year-End Projected Runway</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-accent">
              ${summary?.year_end_projected_savings.toLocaleString() || "0"}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {summary?.days_until_year_end || 45} days to Dec 31
          </span>
        </div>
      </section>

      {/* CATEGORY BUDGETS (USED BY WINTER ARC PLANNER) */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-accent" />
              <span>Category Budgets & Planner Limits</span>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Lucy&apos;s weekly planner matches meal & supplement suggestions to these limits.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {summary?.category_breakdown.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">{cat.category}</span>
                <span className="text-muted-foreground tabular-nums">
                  <span className={cn("font-semibold", cat.spent > cat.limit ? "text-danger" : "text-foreground")}>
                    ${cat.spent}
                  </span>{" "}
                  / ${cat.limit}
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    cat.pct_used >= 100 ? "bg-danger" : cat.pct_used >= 80 ? "bg-fire" : "bg-accent"
                  )}
                  style={{ width: `${cat.pct_used}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{cat.pct_used}% used</span>
                <span>${cat.remaining} remaining this month</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSACTION LEDGER */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transaction Ledger
          </h2>
          <div className="flex gap-1 text-[11px]">
            {(["all", "expense", "income"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  "px-2 py-0.5 rounded capitalize transition-colors",
                  filterType === f
                    ? "bg-surface-2 text-foreground font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-md">
              No transactions recorded in this view.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface-2/60 border border-border p-3 rounded flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-foreground flex items-center gap-2">
                    <span>{tx.note || tx.category}</span>
                    <span className="text-[10px] text-muted-foreground bg-surface-1 px-1.5 py-0.2 rounded border border-border">
                      {tx.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {tx.occurred_on}
                  </div>
                </div>

                <div
                  className={cn(
                    "text-xs font-bold tabular-nums flex items-center gap-0.5",
                    tx.type === "income" ? "text-success" : "text-foreground"
                  )}
                >
                  {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
