import { GroundedRecord } from "../tools/grounding";

export interface MathCheckResult {
  has_numeric_adjustments: boolean;
  computed_totals: {
    total_calories?: number;
    total_protein_g?: number;
    total_water_ml?: number;
  };
  note?: string;
}

/**
 * Calculates ground-truth totals in deterministic server TypeScript code,
 * overriding any arithmetic hallucinations by language models.
 */
export function verifyAndComputeMath(records: GroundedRecord[]): MathCheckResult {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalWater = 0;
  let hasMeals = false;
  let hasWater = false;

  for (const r of records) {
    if (r.category === "Meals" && r.data) {
      hasMeals = true;
      const cal = Number(r.data.calories) || 0;
      const p = Number(r.data.protein_g) || 0;
      totalCalories += cal;
      totalProtein += p;
    }
    if (r.category === "Health" && r.data && r.data.water_ml) {
      hasWater = true;
      totalWater += Number(r.data.water_ml) || 0;
    }
  }

  const computed_totals: MathCheckResult["computed_totals"] = {};
  if (hasMeals) {
    computed_totals.total_calories = Math.round(totalCalories);
    computed_totals.total_protein_g = Math.round(totalProtein);
  }
  if (hasWater) {
    computed_totals.total_water_ml = Math.round(totalWater);
  }

  return {
    has_numeric_adjustments: hasMeals || hasWater,
    computed_totals,
    note: hasMeals
      ? `Server-verified nutritional totals: ${computed_totals.total_calories} kcal, ${computed_totals.total_protein_g}g protein.`
      : undefined,
  };
}
