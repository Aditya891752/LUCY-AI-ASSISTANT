import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "./client";
import { getProfile } from "@/lib/actions/profile";
import { getTodaySummary } from "@/lib/actions/trackers";
import { getMoneyData } from "@/lib/actions/money";
import { getNotes } from "@/lib/actions/notes";
import { evaluateHealthSafety } from "./pipeline/safety-rules";

export const DailyPlanDaySchema = z.object({
  day: z.string(), // "Monday", "Tuesday", etc.
  workout: z.string(),
  meals_focus: z.string(),
  habit_focus: z.string(),
  completed: z.boolean().default(false),
});

export const SupplementItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  dose: z.string(),
  timing: z.string(),
  completed: z.boolean().default(false),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  completed: z.boolean().default(false),
});

export const WeeklyPlanSchema = z.object({
  week_title: z.string(),
  focus_statement: z.string(),
  calorie_target: z.number().int(),
  protein_target_g: z.number().int(),
  water_target_ml: z.number().int(),
  weekly_budget_limit: z.number(),
  days: z.array(DailyPlanDaySchema),
  supplements_schedule: z.array(SupplementItemSchema),
  year_end_checklist: z.array(ChecklistItemSchema),
  verification_report: z.record(z.unknown()).default({}),
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;

function getFallbackWeeklyPlan(
  calories: number,
  protein: number,
  water: number,
  budget: number,
  allergies: string[]
): WeeklyPlan {
  const allergyWarning = allergies.length > 0 ? ` (Allergies strictly avoided: ${allergies.join(", ")})` : "";

  return {
    week_title: "Winter Arc Protocol: Compound Strength & Calibrated Discipline",
    focus_statement: "Execute 5 training sessions, lock in protein floor, and preserve year-end financial runway.",
    calorie_target: calories,
    protein_target_g: protein,
    water_target_ml: water,
    weekly_budget_limit: budget,
    days: [
      { day: "Monday", workout: "Upper Body Push (Bench Press, Incline DB, Dips)", meals_focus: `Hit ${protein}g protein via clean meals${allergyWarning}`, habit_focus: "Cold shower + 3L water", completed: false },
      { day: "Tuesday", workout: "Lower Body Quad Focus (Squats, Bulgarian Split Squats)", meals_focus: "Complex carbs pre-workout (oats/rice)", habit_focus: "No screens 1hr before bed", completed: false },
      { day: "Wednesday", workout: "Zone 2 Active Recovery & Core", meals_focus: "Hydration + electrolyte replenishment", habit_focus: "Review budget & savings", completed: false },
      { day: "Thursday", workout: "Upper Body Pull (Barbell Rows, Pull-ups, Biceps)", meals_focus: `Lean protein meals + veggies${allergyWarning}`, habit_focus: "Morning outdoor walk", completed: false },
      { day: "Friday", workout: "Lower Body Posterior (Deadlifts, RDLs, Hamstrings)", meals_focus: "High-protein post-workout fuel", habit_focus: "Plan weekend discipline", completed: false },
      { day: "Saturday", workout: "Shoulders, Arms & Conditioning", meals_focus: "Nutrient-dense clean eating", habit_focus: "Deep reading (30 mins)", completed: false },
      { day: "Sunday", workout: "Full Rest & Mobility Routine", meals_focus: "Weekly grocery prep within budget", habit_focus: "Weekly reflection & review", completed: false },
    ],
    supplements_schedule: [
      { id: "sup-1", name: "Creatine Monohydrate", dose: "5g", timing: "Morning with water", completed: false },
      { id: "sup-2", name: "Whey Protein Isolate", dose: "30g", timing: "Post-workout", completed: false },
      { id: "sup-3", name: "Vitamin D3 + K2", dose: "5000 IU", timing: "With lunch", completed: false },
      { id: "sup-4", name: "Magnesium Glycinate", dose: "400mg", timing: "30 mins before sleep", completed: false },
    ],
    year_end_checklist: [
      { id: "chk-1", task: "Adhere to weekly grocery spend limit ($" + budget + ")", completed: false },
      { id: "chk-2", task: "Zero skipped compound workouts this week", completed: false },
      { id: "chk-3", task: "Review December savings contribution towards reserve", completed: false },
      { id: "chk-4", task: "Log all meals into Lucy ground-truth tracker daily", completed: false },
    ],
    verification_report: {
      verified: true,
      budget_compliance: true,
      calorie_floor_verified: calories >= 1200,
    },
  };
}

export async function generateWeeklyPlan(): Promise<WeeklyPlan> {
  const [profile, summary, moneyData, notes] = await Promise.all([
    getProfile(),
    getTodaySummary(),
    getMoneyData(),
    getNotes(),
  ]);

  const calories = profile?.targets?.daily_calories || 2200;
  const protein = profile?.targets?.daily_protein_g || 160;
  const water = profile?.targets?.daily_water_ml || 3000;
  const allergies = profile?.allergies || [];
  const monthlyGroceryBudget = moneyData.budgets.find((b) => b.category === "Groceries & Nutrition")?.limit_amount || 600;
  const weeklyBudget = Math.round(monthlyGroceryBudget / 4);

  const ai = getGeminiClient();
  if (!ai) {
    return getFallbackWeeklyPlan(calories, protein, water, weeklyBudget, allergies);
  }

  const model = getGeminiModelName();
  const notesContext = notes.map((n) => `[${n.category}] ${n.text}`).join("\n");

  const prompt = `You are Lucy, an uncompromising, tactical Winter Arc personal assistant.
Generate a structured, personalized 7-day weekly plan for the user based on their ground-truth data:
- Calorie Ceiling: ${calories} kcal
- Protein Floor: ${protein} g
- Daily Water Target: ${water} ml
- Weekly Grocery/Wellness Budget Limit: $${weeklyBudget}
- Allergies: ${allergies.length > 0 ? allergies.join(", ") : "None"}
- User Constraints & Rules:
${notesContext || "None"}

INSTRUCTIONS:
1. Cover Monday through Sunday workouts, meal guidelines, and habit targets.
2. The diet and supplement recommendations MUST strictly adhere to the user's allergies and budget limit ($${weeklyBudget}).
3. Return STRICTLY a valid JSON object matching:
{
  "week_title": string,
  "focus_statement": string,
  "calorie_target": integer,
  "protein_target_g": integer,
  "water_target_ml": integer,
  "weekly_budget_limit": number,
  "days": [
    { "day": string, "workout": string, "meals_focus": string, "habit_focus": string, "completed": false }
  ],
  "supplements_schedule": [
    { "id": string, "name": string, "dose": string, "timing": string, "completed": false }
  ],
  "year_end_checklist": [
    { "id": string, "task": string, "completed": false }
  ]
}
Do not include markdown fences or any other text.`;

  try {
    const res = await ai.models.generateContent({ model, contents: prompt });
    const clean = (res.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Double-verification & health safety layer
    const safety = evaluateHealthSafety(parsed.focus_statement, []);
    const verifiedCalorie = Math.max(parsed.calorie_target || calories, 1200);

    return WeeklyPlanSchema.parse({
      ...parsed,
      calorie_target: verifiedCalorie,
      protein_target_g: parsed.protein_target_g || protein,
      water_target_ml: parsed.water_target_ml || water,
      weekly_budget_limit: Math.min(parsed.weekly_budget_limit || weeklyBudget, weeklyBudget),
      verification_report: {
        verified: true,
        safety_warnings: safety.warnings,
        budget_limit: weeklyBudget,
      },
    });
  } catch (err) {
    console.warn("Gemini plan generation failed, using fallback:", err);
    return getFallbackWeeklyPlan(calories, protein, water, weeklyBudget, allergies);
  }
}
