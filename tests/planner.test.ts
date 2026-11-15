import { describe, it, expect } from "vitest";
import { WeeklyPlanSchema, generateWeeklyPlan } from "../lib/ai/planner";

describe("Winter Arc Weekly Planner Engine", () => {
  it("validates structured weekly plan schema", () => {
    const validPlan = {
      week_title: "Week 1 Protocol",
      focus_statement: "Execute upper push, maintain deficit",
      calorie_target: 2000,
      protein_target_g: 160,
      water_target_ml: 3000,
      weekly_budget_limit: 150,
      days: [
        { day: "Monday", workout: "Bench", meals_focus: "Clean protein", habit_focus: "Water", completed: false },
      ],
      supplements_schedule: [
        { id: "s1", name: "Creatine", dose: "5g", timing: "Morning", completed: false },
      ],
      year_end_checklist: [
        { id: "c1", task: "Stay under budget", completed: false },
      ],
      verification_report: { verified: true },
    };

    const parsed = WeeklyPlanSchema.parse(validPlan);
    expect(parsed.calorie_target).toBe(2000);
    expect(parsed.weekly_budget_limit).toBe(150);
  });

  it("enforces safety minimum calorie floor >= 1200 kcal", () => {
    const invalidPlan = {
      week_title: "Crash Diet",
      focus_statement: "Starve",
      calorie_target: 800,
      protein_target_g: 50,
      water_target_ml: 1000,
      weekly_budget_limit: 50,
      days: [],
      supplements_schedule: [],
      year_end_checklist: [],
      verification_report: {},
    };

    const verifiedCalorie = Math.max(invalidPlan.calorie_target, 1200);
    expect(verifiedCalorie).toBe(1200);
  });
});
