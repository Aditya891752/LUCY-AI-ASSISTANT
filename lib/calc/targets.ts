import { ActivityLevel, CalcBaseline, Goal } from "@/lib/db/types";

export interface TargetCalculationInput {
  calc_baseline: CalcBaseline;
  weight_kg: number;
  height_cm: number;
  age: number;
  activity_level: ActivityLevel;
  goals: Goal[];
}

export interface TargetCalculationResult {
  bmr: number;
  tdee: number;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_water_ml: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

/**
 * Calculates Mifflin-St Jeor Basal Metabolic Rate (BMR)
 */
export function calculateBMR(
  baseline: CalcBaseline,
  weight_kg: number,
  height_cm: number,
  age: number
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;

  if (baseline === "Male") {
    return Math.round(base + 5);
  } else if (baseline === "Female") {
    return Math.round(base - 161);
  } else {
    // Average baseline for non-binary or unstated users
    return Math.round(base - 78);
  }
}

/**
 * Computes Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates complete daily calorie, macro, and hydration targets
 */
export function calculateTargets(input: TargetCalculationInput): TargetCalculationResult {
  const bmr = calculateBMR(input.calc_baseline, input.weight_kg, input.height_cm, input.age);
  const tdee = calculateTDEE(bmr, input.activity_level);

  let targetCalories = tdee;
  const isFatLoss = input.goals.includes("fat loss");
  const isMuscleGain = input.goals.includes("muscle gain");

  if (isFatLoss) {
    targetCalories = Math.round(tdee * 0.8); // 20% deficit
  } else if (isMuscleGain) {
    targetCalories = Math.round(tdee * 1.1); // 10% surplus
  }

  // Safety floor: Never prescribe fewer than 1200 kcal for general health safety
  targetCalories = Math.max(targetCalories, 1200);

  // Protein calculation (g per kg bodyweight)
  let proteinRatio = 1.6;
  if (isFatLoss) {
    proteinRatio = 2.0; // Higher protein in deficit to preserve lean mass
  } else if (isMuscleGain) {
    proteinRatio = 2.0;
  }
  const daily_protein_g = Math.round(input.weight_kg * proteinRatio);

  // Fat calculation (minimum 0.8g per kg for hormonal health)
  const daily_fat_g = Math.round(input.weight_kg * 0.8);

  // Remaining calories to Carbs: 1g Protein = 4 kcal, 1g Fat = 9 kcal, 1g Carb = 4 kcal
  const proteinKcal = daily_protein_g * 4;
  const fatKcal = daily_fat_g * 9;
  const remainingKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const daily_carbs_g = Math.round(remainingKcal / 4);

  // Water hydration target: 35ml per kg + extra 500ml for active
  const activityBonus = input.activity_level === "sedentary" ? 0 : 500;
  const daily_water_ml = Math.round(input.weight_kg * 35 + activityBonus);

  return {
    bmr,
    tdee,
    daily_calories: targetCalories,
    daily_protein_g,
    daily_carbs_g,
    daily_fat_g,
    daily_water_ml,
  };
}
