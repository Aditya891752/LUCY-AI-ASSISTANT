import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "./client";

export const MealEstimateSchema = z.object({
  description: z.string(),
  calories: z.number().int().nonnegative(),
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type MealEstimate = z.infer<typeof MealEstimateSchema>;

/**
 * Heuristic offline estimator used when GEMINI_API_KEY is not configured in local environment
 */
function offlineEstimateMeal(text: string): MealEstimate {
  const lower = text.toLowerCase();
  let calories = 350;
  let protein_g = 15;
  let carbs_g = 45;
  let fat_g = 12;

  if (lower.includes("roti") || lower.includes("chapati")) {
    const match = lower.match(/(\d+)\s*(roti|chapati)/);
    const count = match ? parseInt(match[1]) : 2;
    calories += count * 105;
    carbs_g += count * 20;
    protein_g += count * 3;
  }
  if (lower.includes("paneer")) {
    calories += 260;
    protein_g += 18;
    fat_g += 20;
  }
  if (lower.includes("dal") || lower.includes("daal") || lower.includes("lentil")) {
    calories += 180;
    protein_g += 12;
    carbs_g += 28;
  }
  if (lower.includes("egg")) {
    const match = lower.match(/(\d+)\s*egg/);
    const count = match ? parseInt(match[1]) : 2;
    calories += count * 75;
    protein_g += count * 6;
    fat_g += count * 5;
  }
  if (lower.includes("chicken") || lower.includes("breast")) {
    calories += 250;
    protein_g += 35;
    fat_g += 6;
  }
  if (lower.includes("rice")) {
    calories += 210;
    carbs_g += 45;
    protein_g += 4;
  }
  if (lower.includes("shake") || lower.includes("whey")) {
    calories += 150;
    protein_g += 25;
    carbs_g += 5;
    fat_g += 2;
  }

  return {
    description: text,
    calories: Math.round(calories),
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fat_g: Math.round(fat_g),
    notes: "Estimated via nutritional baseline (local fallback)",
  };
}

export async function estimateMealMacros(mealText: string): Promise<MealEstimate> {
  const trimmed = mealText.trim();
  if (!trimmed) {
    throw new Error("Meal description cannot be empty");
  }

  const ai = getGeminiClient();
  if (!ai) {
    return offlineEstimateMeal(trimmed);
  }

  try {
    const model = getGeminiModelName();
    const prompt = `You are a certified clinical sports nutritionist.
Estimate the realistic caloric and macronutrient breakdown for this meal: "${trimmed}".
Respond STRICTLY with a valid JSON object matching this schema:
{
  "description": string,
  "calories": integer,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "notes": string
}
Do not include markdown fences, backticks, or extra commentary. Only valid JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return MealEstimateSchema.parse(parsed);
  } catch (error) {
    console.warn("Gemini meal estimation failed, falling back to heuristic:", error);
    return offlineEstimateMeal(trimmed);
  }
}
