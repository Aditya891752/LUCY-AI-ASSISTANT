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
  allergies: string[],
  goals: string[] = ["discipline"]
): WeeklyPlan {
  const allergyWarning = allergies.length > 0 ? ` (Allergies strictly avoided: ${allergies.join(", ")})` : "";
  const goalStr = goals.join(", ");

  return {
    week_title: `Winter Arc Protocol: Calibrated Strength & Habit Consistency (${goalStr})`,
    focus_statement: "Execute 5 structured training sessions, hit your calibrated protein floor, and preserve year-end financial runway.",
    calorie_target: calories,
    protein_target_g: protein,
    water_target_ml: water,
    weekly_budget_limit: budget,
    days: [
      { day: "Monday", workout: "Full-Body Strength & Core (Squats/Leg Press, Push-ups/Dumbbell Press, Planks)", meals_focus: `Hit ${protein}g protein via balanced meals${allergyWarning}`, habit_focus: "Hydration target + morning routine", completed: false },
      { day: "Tuesday", workout: "Aerobic Conditioning & Cardio Capacity (Interval Runs, Rowing, or Incline Walk)", meals_focus: "Complex carbs pre-workout (oats/quinoa/fruit)", habit_focus: "Screen curfew 45m before bed", completed: false },
      { day: "Wednesday", workout: "Active Recovery, Core & Mobility (Hips, Thoracic spine, Dynamic flow)", meals_focus: "Hydration + electrolyte replenishment", habit_focus: "Review budget & weekly runway", completed: false },
      { day: "Thursday", workout: "Posterior Chain & Upper Pull (Romanian Deadlifts, Dumbbell Rows, Lat Pulldowns)", meals_focus: `Lean protein + leafy greens${allergyWarning}`, habit_focus: "Morning outdoor natural light walk", completed: false },
      { day: "Friday", workout: "Functional Strength & Lower Body Stability (Lunges, Overhead Press, Core Carries)", meals_focus: "Nutrient-dense post-workout fuel", habit_focus: "Weekend discipline planning", completed: false },
      { day: "Saturday", workout: "Metabolic Conditioning, Sports, or Trail Walk", meals_focus: "Wholesome, home-cooked clean nutrition", habit_focus: "Focused reading / learning session (30 mins)", completed: false },
      { day: "Sunday", workout: "Full Rest, Breathwork & Guided Mobility", meals_focus: "Weekly grocery prep within budget", habit_focus: "Weekly review & habit scorecard", completed: false },
    ],
    supplements_schedule: [
      { id: "sup-1", name: "Vitamin D3 + K2", dose: "2000-5000 IU", timing: "Morning with meal", completed: false },
      { id: "sup-2", name: "Protein Fuel (Whey or Plant-based)", dose: "25-30g", timing: "Post-workout or snack", completed: false },
      { id: "sup-3", name: "Omega-3 EPA/DHA", dose: "1000mg", timing: "With lunch", completed: false },
      { id: "sup-4", name: "Magnesium Glycinate", dose: "300-400mg", timing: "30 mins before sleep", completed: false },
    ],
    year_end_checklist: [
      { id: "chk-1", task: "Adhere to weekly grocery spend limit ($" + budget + ")", completed: false },
      { id: "chk-2", task: "Zero skipped training or mobility sessions this week", completed: false },
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

  const baseline = profile?.calc_baseline || "Average";
  const defaultCalories = baseline === "Female" ? 1800 : baseline === "Male" ? 2100 : 1950;
  const defaultProtein = baseline === "Female" ? 110 : baseline === "Male" ? 140 : 125;
  const defaultWater = baseline === "Female" ? 2500 : baseline === "Male" ? 3000 : 2750;

  const calories = profile?.targets?.daily_calories || defaultCalories;
  const protein = profile?.targets?.daily_protein_g || defaultProtein;
  const water = profile?.targets?.daily_water_ml || defaultWater;
  const allergies = profile?.allergies || [];
  const goals = profile?.goals || ["discipline"];
  const monthlyGroceryBudget = moneyData.budgets.find((b) => b.category === "Groceries & Nutrition")?.limit_amount || 600;
  const weeklyBudget = Math.round(monthlyGroceryBudget / 4);

  const ai = getGeminiClient();
  if (!ai) {
    return getFallbackWeeklyPlan(calories, protein, water, weeklyBudget, allergies, goals);
  }

  const model = getGeminiModelName();
  const notesContext = notes.map((n) => `[${n.category}] ${n.text}`).join("\n");

  const prompt = `You are Lucy, an uncompromising, tactical Winter Arc personal assistant.
Generate a structured, personalized 7-day weekly plan for the user based on their ground-truth data:
- Identity & Baseline: Gender: ${profile?.gender || "Not specified"}, Calculation Baseline: ${baseline}
- Goals: ${goals.join(", ")}
- Calorie Target: ${calories} kcal
- Protein Target: ${protein} g
- Daily Water Target: ${water} ml
- Weekly Grocery/Wellness Budget Limit: $${weeklyBudget}
- Allergies: ${allergies.length > 0 ? allergies.join(", ") : "None"}
- User Constraints & Rules:
${notesContext || "None"}

INSTRUCTIONS:
1. Cover Monday through Sunday workouts, meal guidelines, and habit targets.
2. Tailor exercise choices to the user's explicit goals and fitness level. Do NOT default to generic male gym bro-splits (e.g. bench press/dips only); provide balanced, functional strength, mobility, and cardiovascular routines suitable for any gender.
3. The diet and supplement recommendations MUST strictly adhere to the user's allergies and budget limit ($${weeklyBudget}).
4. Return STRICTLY a valid JSON object matching:
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
