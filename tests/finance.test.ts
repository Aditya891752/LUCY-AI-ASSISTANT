import { describe, it, expect } from "vitest";
import { calculateFinanceSummary, TransactionItem, BudgetLimit } from "../lib/calc/finance";

describe("Finance & Year-End Projection Engine", () => {
  it("calculates totals, net savings, and budget percentages accurately", () => {
    const transactions: TransactionItem[] = [
      { id: "1", amount: 5000, type: "income", category: "Salary", occurred_on: "2026-11-01" },
      { id: "2", amount: 600, type: "expense", category: "Groceries & Nutrition", occurred_on: "2026-11-03" },
      { id: "3", amount: 150, type: "expense", category: "Fitness & Supplements", occurred_on: "2026-11-05" },
      { id: "4", amount: 1200, type: "expense", category: "Rent & Utilities", occurred_on: "2026-11-01" },
    ];

    const budgets: BudgetLimit[] = [
      { category: "Groceries & Nutrition", limit_amount: 800 },
      { category: "Fitness & Supplements", limit_amount: 200 },
      { category: "Rent & Utilities", limit_amount: 1200 },
    ];

    // Reference date: Nov 15, 2026
    const refDate = new Date("2026-11-15T12:00:00Z");
    const summary = calculateFinanceSummary(transactions, budgets, refDate);

    expect(summary.total_income).toBe(5000);
    expect(summary.total_expenses).toBe(1950);
    expect(summary.net_savings).toBe(3050);
    expect(summary.savings_rate_pct).toBe(61); // 3050 / 5000 = 61%

    const nutritionBudget = summary.category_breakdown.find((c) => c.category === "Groceries & Nutrition");
    expect(nutritionBudget?.spent).toBe(600);
    expect(nutritionBudget?.remaining).toBe(200);
    expect(nutritionBudget?.pct_used).toBe(75); // 600 / 800 = 75%
  });

  it("handles empty transactions safely", () => {
    const summary = calculateFinanceSummary([], []);
    expect(summary.total_income).toBe(0);
    expect(summary.total_expenses).toBe(0);
    expect(summary.net_savings).toBe(0);
    expect(summary.savings_rate_pct).toBe(0);
  });
});
