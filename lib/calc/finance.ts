export interface TransactionItem {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  note?: string | null;
  occurred_on: string;
}

export interface BudgetLimit {
  category: string;
  limit_amount: number;
}

export interface FinanceSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate_pct: number;
  year_end_projected_savings: number;
  days_until_year_end: number;
  category_breakdown: Array<{
    category: string;
    spent: number;
    limit: number;
    pct_used: number;
    remaining: number;
  }>;
}

/**
 * Deterministically computes finance metrics, budget utilization, and year-end projections.
 */
export function calculateFinanceSummary(
  transactions: TransactionItem[],
  budgets: BudgetLimit[],
  currentDate: Date = new Date()
): FinanceSummary {
  let total_income = 0;
  let total_expenses = 0;
  const categorySpent: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === "income") {
      total_income += t.amount;
    } else {
      total_expenses += t.amount;
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    }
  }

  const net_savings = total_income - total_expenses;
  const savings_rate_pct = total_income > 0 ? Math.round((net_savings / total_income) * 100) : 0;

  // Year-end calculation (Until Dec 31st of current year)
  const currentYear = currentDate.getFullYear();
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
  const diffTime = Math.max(yearEnd.getTime() - currentDate.getTime(), 0);
  const days_until_year_end = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.max(days_until_year_end / 30.4, 0.5);

  // Projected savings: current net savings + (monthly savings rate * months remaining)
  const monthlySavingsRunway = net_savings > 0 ? net_savings : 0;
  const year_end_projected_savings = Math.round(monthlySavingsRunway * monthsRemaining);

  // Category breakdown
  const category_breakdown = budgets.map((b) => {
    const spent = categorySpent[b.category] || 0;
    const pct_used = b.limit_amount > 0 ? Math.min(Math.round((spent / b.limit_amount) * 100), 100) : 0;
    const remaining = Math.max(b.limit_amount - spent, 0);

    return {
      category: b.category,
      spent,
      limit: b.limit_amount,
      pct_used,
      remaining,
    };
  });

  return {
    total_income,
    total_expenses,
    net_savings,
    savings_rate_pct,
    year_end_projected_savings,
    days_until_year_end,
    category_breakdown,
  };
}
