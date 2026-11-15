import { getTodaySummary } from "@/lib/actions/trackers";
import { getEvents } from "@/lib/actions/events";
import { getMoneyData } from "@/lib/actions/money";
import { getNotes } from "@/lib/actions/notes";
import { getProfile } from "@/lib/actions/profile";

export interface GroundedRecord {
  id: string;
  category: "Schedule" | "Meals" | "Health" | "Fitness" | "Supplements" | "Habits" | "Money" | "Notes";
  description: string;
  date: string;
  data: Record<string, unknown>;
}

export interface GroundedQueryResult {
  category: string;
  records: GroundedRecord[];
}

export async function executeGroundingQueries(intent: string): Promise<GroundedQueryResult[]> {
  const lower = intent.toLowerCase();
  const results: GroundedQueryResult[] = [];

  const [summary, events, moneyData, notes, profile] = await Promise.all([
    getTodaySummary(),
    getEvents(),
    getMoneyData(),
    getNotes(),
    getProfile(),
  ]);

  // 1. MEALS QUERY
  if (lower.includes("eat") || lower.includes("ate") || lower.includes("meal") || lower.includes("calorie") || lower.includes("protein") || lower.includes("nutrition") || lower.includes("food")) {
    const mealRecords: GroundedRecord[] = summary.meals.map((m) => ({
      id: m.id,
      category: "Meals",
      description: `${m.description} (${m.calories} kcal, ${m.protein_g}g protein)`,
      date: m.eaten_at,
      data: { ...m },
    }));
    results.push({ category: "Meals", records: mealRecords });
  }

  // 2. SCHEDULE / EVENTS QUERY
  if (lower.includes("meeting") || lower.includes("remind") || lower.includes("schedule") || lower.includes("event") || lower.includes("when is") || lower.includes("appointment")) {
    const eventRecords: GroundedRecord[] = events.map((e) => ({
      id: e.id,
      category: "Schedule",
      description: `${e.title} on ${e.display_time || e.starts_at} with ${e.people.join(", ") || "No attendees"}`,
      date: e.starts_at,
      data: { ...e },
    }));
    results.push({ category: "Schedule", records: eventRecords });
  }

  // 3. HEALTH / VITALS QUERY
  if (lower.includes("water") || lower.includes("weight") || lower.includes("sleep") || lower.includes("health") || lower.includes("vital") || lower.includes("blood pressure") || lower.includes("glucose")) {
    const vitalsRecords: GroundedRecord[] = [];
    if (summary.consumed_water_ml > 0) {
      vitalsRecords.push({
        id: "vital-water",
        category: "Health",
        description: `Consumed ${summary.consumed_water_ml} ml water today`,
        date: new Date().toISOString(),
        data: { water_ml: summary.consumed_water_ml },
      });
    }
    if (summary.vitals.weight_kg) {
      vitalsRecords.push({
        id: "vital-weight",
        category: "Health",
        description: `Logged morning weight: ${summary.vitals.weight_kg} kg`,
        date: new Date().toISOString(),
        data: { weight_kg: summary.vitals.weight_kg },
      });
    }
    if (summary.vitals.sleep_h) {
      vitalsRecords.push({
        id: "vital-sleep",
        category: "Health",
        description: `Logged sleep: ${summary.vitals.sleep_h} hours`,
        date: new Date().toISOString(),
        data: { sleep_h: summary.vitals.sleep_h },
      });
    }
    results.push({ category: "Health", records: vitalsRecords });
  }

  // 4. FITNESS / WORKOUTS QUERY
  if (lower.includes("workout") || lower.includes("exercise") || lower.includes("gym") || lower.includes("train") || lower.includes("lift")) {
    const workoutRecords: GroundedRecord[] = summary.workouts.map((w) => ({
      id: w.id,
      category: "Fitness",
      description: `${w.exercise}: ${w.sets} sets x ${w.reps} reps @ ${w.weight_kg} kg`,
      date: new Date().toISOString(),
      data: { ...w },
    }));
    results.push({ category: "Fitness", records: workoutRecords });
  }

  // 5. HABITS QUERY
  if (lower.includes("habit") || lower.includes("streak") || lower.includes("discipline")) {
    const habitRecords: GroundedRecord[] = summary.habits.map((h) => ({
      id: h.id,
      category: "Habits",
      description: `Habit "${h.name}": status ${h.done ? "Completed" : "Pending"}, current streak ${h.streak} days`,
      date: new Date().toISOString(),
      data: { ...h },
    }));
    results.push({ category: "Habits", records: habitRecords });
  }

  // 6. MONEY QUERY
  if (lower.includes("spend") || lower.includes("spent") || lower.includes("money") || lower.includes("budget") || lower.includes("income") || lower.includes("saving") || lower.includes("expense") || lower.includes("dollar") || lower.includes("$")) {
    const moneyRecords: GroundedRecord[] = moneyData.transactions.slice(0, 5).map((t) => ({
      id: t.id,
      category: "Money",
      description: `${t.type === "income" ? "Inflow" : "Outflow"}: $${t.amount} for ${t.category} (${t.note || "No note"}) on ${t.occurred_on}`,
      date: t.occurred_on,
      data: { ...t },
    }));
    results.push({ category: "Money", records: moneyRecords });
  }

  // 7. USER NOTES & CONSTRAINTS QUERY
  const noteRecords: GroundedRecord[] = notes.map((n) => ({
    id: n.id,
    category: "Notes",
    description: `User Preference [${n.category}]: "${n.text}"`,
    date: n.created_at,
    data: { ...n },
  }));
  // Always include notes as constraints
  results.push({ category: "Notes", records: noteRecords });

  return results;
}
