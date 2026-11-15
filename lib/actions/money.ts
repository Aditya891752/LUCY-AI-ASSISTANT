"use server";

import { createClient } from "@/lib/db/supabase-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { calculateFinanceSummary, TransactionItem, BudgetLimit, FinanceSummary } from "@/lib/calc/finance";

export interface LogTransactionInput {
  amount: number;
  type: "income" | "expense";
  category: string;
  note?: string;
}

export interface MoneyGoal {
  name: string;
  target: number;
  deadline?: string;
}

const DEFAULT_BUDGETS: BudgetLimit[] = [
  { category: "Groceries & Nutrition", limit_amount: 600 },
  { category: "Fitness & Supplements", limit_amount: 150 },
  { category: "Living & Utilities", limit_amount: 1200 },
  { category: "Discretionary", limit_amount: 250 },
];

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  { id: "t1", amount: 4500, type: "income", category: "Salary", note: "Monthly base income", occurred_on: "2026-11-01" },
  { id: "t2", amount: 1100, type: "expense", category: "Living & Utilities", note: "Rent", occurred_on: "2026-11-01" },
  { id: "t3", amount: 240, type: "expense", category: "Groceries & Nutrition", note: "Clean protein, eggs, oats, vegetables", occurred_on: "2026-11-04" },
  { id: "t4", amount: 65, type: "expense", category: "Fitness & Supplements", note: "Creatine monohydrate & Whey", occurred_on: "2026-11-06" },
];

export async function getMoneyData(): Promise<{
  summary: FinanceSummary;
  transactions: TransactionItem[];
  budgets: BudgetLimit[];
  goal: MoneyGoal;
}> {
  const cookieStore = await cookies();
  const cachedTx = cookieStore.get("lucy_transactions")?.value;
  const cachedBudgets = cookieStore.get("lucy_budgets")?.value;
  const cachedGoal = cookieStore.get("lucy_savings_goal")?.value;

  let transactions: TransactionItem[] = cachedTx ? JSON.parse(cachedTx) : DEFAULT_TRANSACTIONS;
  let budgets: BudgetLimit[] = cachedBudgets ? JSON.parse(cachedBudgets) : DEFAULT_BUDGETS;
  let goal: MoneyGoal = cachedGoal
    ? JSON.parse(cachedGoal)
    : { name: "Winter Arc Year-End Reserve", target: 5000, deadline: "2026-12-31" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: dbTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_on", { ascending: false });

    if (dbTx && dbTx.length > 0) {
      transactions = dbTx;
    }

    const { data: dbBudgets } = await supabase
      .from("budgets")
      .select("category, limit_amount")
      .eq("user_id", user.id);

    if (dbBudgets && dbBudgets.length > 0) {
      budgets = dbBudgets;
    }
  }

  const summary = calculateFinanceSummary(transactions, budgets);

  return {
    summary,
    transactions,
    budgets,
    goal,
  };
}

export async function logTransaction(input: LogTransactionInput) {
  const cookieStore = await cookies();
  const { transactions } = await getMoneyData();

  const newTx: TransactionItem = {
    id: `tx-${Date.now()}`,
    amount: input.amount,
    type: input.type,
    category: input.category,
    note: input.note || null,
    occurred_on: new Date().toISOString().split("T")[0],
  };

  const updated = [newTx, ...transactions];
  cookieStore.set("lucy_transactions", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: input.amount,
      type: input.type,
      category: input.category,
      note: input.note,
      occurred_on: newTx.occurred_on,
    });
  }

  revalidatePath("/money");
  return { success: true, transaction: newTx };
}

export async function setBudget(category: string, limit_amount: number) {
  const cookieStore = await cookies();
  const { budgets } = await getMoneyData();

  const updated = budgets.map((b) => (b.category === category ? { ...b, limit_amount } : b));
  cookieStore.set("lucy_budgets", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const month = new Date().toISOString().slice(0, 7);
    await supabase.from("budgets").upsert({
      user_id: user.id,
      month,
      category,
      limit_amount,
    });
  }

  revalidatePath("/money");
  return { success: true };
}
