import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "./client";
import { estimateMealMacros } from "./meals";
import { parseEventNaturalLanguage } from "./events";

export const ParsedCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("meal"),
    description: z.string(),
    calories: z.number().int(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
  }),
  z.object({
    type: z.literal("event"),
    title: z.string(),
    starts_at: z.string(),
    display_time: z.string(),
    people: z.array(z.string()),
    location: z.string().optional(),
    remind_offsets: z.array(z.number()),
  }),
  z.object({
    type: z.literal("health"),
    metric: z.enum(["weight", "water_ml", "sleep_h", "steps", "mood", "bp_sys", "bp_dia", "glucose"]),
    value: z.number(),
  }),
  z.object({
    type: z.literal("question"),
    query: z.string(),
  }),
]);

export type ParsedCommand = z.infer<typeof ParsedCommandSchema>;

export async function parseCommandInput(rawInput: string): Promise<ParsedCommand> {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  // Fast deterministic prefix routing
  if (lower.startsWith("log meal:") || lower.startsWith("log lunch:") || lower.startsWith("log breakfast:") || lower.startsWith("log dinner:") || lower.startsWith("ate ") || lower.startsWith("had ")) {
    const mealDescription = text.replace(/^(log (meal|lunch|breakfast|dinner):\s*|ate\s+|had\s+)/i, "");
    const estimated = await estimateMealMacros(mealDescription);
    return {
      type: "meal",
      description: mealDescription,
      calories: estimated.calories,
      protein_g: estimated.protein_g,
      carbs_g: estimated.carbs_g,
      fat_g: estimated.fat_g,
    };
  }

  if (lower.startsWith("remind me") || lower.startsWith("meeting with") || lower.startsWith("schedule ") || lower.includes("at ") && (lower.includes("am") || lower.includes("pm"))) {
    const parsedEvent = await parseEventNaturalLanguage(text);
    return {
      type: "event",
      title: parsedEvent.title,
      starts_at: parsedEvent.starts_at,
      display_time: parsedEvent.display_time,
      people: parsedEvent.people,
      location: parsedEvent.location,
      remind_offsets: parsedEvent.remind_offsets,
    };
  }

  if (lower.includes("water") || lower.includes("drink")) {
    const match = text.match(/(\d+)\s*ml/i);
    const amount = match ? parseInt(match[1]) : 250;
    return {
      type: "health",
      metric: "water_ml",
      value: amount,
    };
  }

  // LLM classification if Gemini API key is available
  const ai = getGeminiClient();
  if (ai) {
    try {
      const model = getGeminiModelName();
      const prompt = `Classify this user input into one of: 'meal', 'event', 'health', or 'question'.
Input: "${text}"
Respond ONLY with a JSON object matching:
{"type": "meal"|"event"|"health"|"question", "summary": string}`;
      const res = await ai.models.generateContent({ model, contents: prompt });
      const clean = (res.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
      const obj = JSON.parse(clean);
      if (obj.type === "meal") {
        const est = await estimateMealMacros(text);
        return {
          type: "meal",
          description: text,
          calories: est.calories,
          protein_g: est.protein_g,
          carbs_g: est.carbs_g,
          fat_g: est.fat_g,
        };
      }
    } catch {
      // Fallback to question
    }
  }

  // Default to question
  return {
    type: "question",
    query: text,
  };
}
