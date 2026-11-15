"use server";

import { createClient } from "@/lib/db/supabase-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface LogMealInput {
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  user_edited?: boolean;
}

export interface LogVitalsInput {
  weight_kg?: number;
  sleep_h?: number;
  steps?: number;
  mood?: number;
  bp_sys?: number;
  bp_dia?: number;
  glucose?: number;
}

export interface LogWorkoutInput {
  exercise: string;
  sets: number;
  reps: number;
  weight_kg: number;
  duration_min: number;
}

export interface DaySummary {
  consumed_calories: number;
  consumed_protein_g: number;
  consumed_carbs_g: number;
  consumed_fat_g: number;
  consumed_water_ml: number;
  completed_habits_count: number;
  total_habits_count: number;
  meals: Array<{
    id: string;
    description: string;
    calories: number;
    protein_g: number;
    user_edited: boolean;
    eaten_at: string;
  }>;
  workouts: Array<{
    id: string;
    exercise: string;
    sets: number;
    reps: number;
    weight_kg: number;
  }>;
  habits: Array<{
    id: string;
    name: string;
    streak: number;
    done: boolean;
  }>;
  vitals: {
    weight_kg?: number;
    sleep_h?: number;
    steps?: number;
    mood?: number;
    bp_sys?: number;
    bp_dia?: number;
    glucose?: number;
    medical_alert?: string | null;
  };
}

// In-memory / session cookie fallback store for offline development
const DEFAULT_HABITS = [
  { id: "h1", name: "Winter Arc Workout Session", target_per_week: 6, streak: 3, done: false },
  { id: "h2", name: "Hit Daily Protein Floor", target_per_week: 7, streak: 5, done: false },
  { id: "h3", name: "Drink 3L Hydration", target_per_week: 7, streak: 2, done: false },
  { id: "h4", name: "7.5+ Hours Sleep", target_per_week: 7, streak: 4, done: false },
];

export async function getTodaySummary(): Promise<DaySummary> {
  const cookieStore = await cookies();
  const todayStr = new Date().toISOString().split("T")[0];

  const cachedMealsRaw = cookieStore.get("lucy_today_meals")?.value;
  const cachedWaterRaw = cookieStore.get("lucy_today_water")?.value;
  const cachedHabitsRaw = cookieStore.get("lucy_today_habits")?.value;
  const cachedWorkoutsRaw = cookieStore.get("lucy_today_workouts")?.value;
  const cachedVitalsRaw = cookieStore.get("lucy_today_vitals")?.value;

  const meals = cachedMealsRaw ? JSON.parse(cachedMealsRaw) : [];
  const consumedWater = cachedWaterRaw ? parseInt(cachedWaterRaw) : 0;
  const habits = cachedHabitsRaw ? JSON.parse(cachedHabitsRaw) : DEFAULT_HABITS;
  const workouts = cachedWorkoutsRaw ? JSON.parse(cachedWorkoutsRaw) : [];
  const vitals = cachedVitalsRaw ? JSON.parse(cachedVitalsRaw) : {};

  // Deterministic math check calculated in server code
  const consumed_calories = meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
  const consumed_protein_g = meals.reduce((acc: number, m: any) => acc + (m.protein_g || 0), 0);
  const consumed_carbs_g = meals.reduce((acc: number, m: any) => acc + (m.carbs_g || 0), 0);
  const consumed_fat_g = meals.reduce((acc: number, m: any) => acc + (m.fat_g || 0), 0);

  const completed_habits_count = habits.filter((h: any) => h.done).length;

  return {
    consumed_calories,
    consumed_protein_g,
    consumed_carbs_g,
    consumed_fat_g,
    consumed_water_ml: consumedWater,
    completed_habits_count,
    total_habits_count: habits.length,
    meals,
    workouts,
    habits,
    vitals,
  };
}

export async function logMeal(input: LogMealInput) {
  const cookieStore = await cookies();
  const summary = await getTodaySummary();

  const newMeal = {
    id: `meal-${Date.now()}`,
    description: input.description,
    calories: input.calories,
    protein_g: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g,
    user_edited: input.user_edited ?? false,
    eaten_at: new Date().toISOString(),
  };

  const updatedMeals = [newMeal, ...summary.meals];
  cookieStore.set("lucy_today_meals", JSON.stringify(updatedMeals), { path: "/" });

  // Sync to Supabase if session active
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("meals").insert({
      user_id: user.id,
      description: input.description,
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      user_edited: input.user_edited ?? false,
    });
  }

  revalidatePath("/today");
  revalidatePath("/track");
  return { success: true, meal: newMeal };
}

export async function logWater(amount_ml: number) {
  const cookieStore = await cookies();
  const current = parseInt(cookieStore.get("lucy_today_water")?.value || "0");
  const updated = current + amount_ml;
  cookieStore.set("lucy_today_water", updated.toString(), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("health_logs").insert({
      user_id: user.id,
      metric: "water_ml",
      value: amount_ml,
    });
  }

  revalidatePath("/today");
  return { success: true, total_water: updated };
}

export async function toggleHabit(habitId: string) {
  const cookieStore = await cookies();
  const summary = await getTodaySummary();

  const updated = summary.habits.map((h) => {
    if (h.id === habitId) {
      const nextDone = !h.done;
      return {
        ...h,
        done: nextDone,
        streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
      };
    }
    return h;
  });

  cookieStore.set("lucy_today_habits", JSON.stringify(updated), { path: "/" });
  revalidatePath("/today");
  revalidatePath("/track");
  return { success: true, habits: updated };
}

export async function logWorkout(input: LogWorkoutInput) {
  const cookieStore = await cookies();
  const summary = await getTodaySummary();

  const newWorkout = {
    id: `workout-${Date.now()}`,
    exercise: input.exercise,
    sets: input.sets,
    reps: input.reps,
    weight_kg: input.weight_kg,
    duration_min: input.duration_min,
  };

  const updated = [newWorkout, ...summary.workouts];
  cookieStore.set("lucy_today_workouts", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("workouts").insert({
      user_id: user.id,
      exercise: input.exercise,
      sets: input.sets,
      reps: input.reps,
      weight_kg: input.weight_kg,
      duration_min: input.duration_min,
    });
  }

  revalidatePath("/today");
  revalidatePath("/track");
  return { success: true, workout: newWorkout };
}

export async function logVitals(input: LogVitalsInput) {
  const cookieStore = await cookies();
  const summary = await getTodaySummary();

  // Clinical reference range safety checks (No diagnosis rule)
  let medical_alert: string | null = null;
  if (input.bp_sys && input.bp_dia) {
    if (input.bp_sys >= 140 || input.bp_dia >= 90) {
      medical_alert = "Blood pressure reading is outside standard normal reference range (<120/80 mmHg). Consider consulting your healthcare professional. No diagnosis is provided.";
    }
  }
  if (input.glucose && input.glucose > 140) {
    medical_alert = "Fasting/random glucose is elevated above standard baseline. Please discuss with your doctor. No diagnosis is provided.";
  }

  const updatedVitals = {
    ...summary.vitals,
    ...input,
    medical_alert,
  };

  cookieStore.set("lucy_today_vitals", JSON.stringify(updatedVitals), { path: "/" });

  revalidatePath("/today");
  revalidatePath("/track");
  return { success: true, vitals: updatedVitals };
}
