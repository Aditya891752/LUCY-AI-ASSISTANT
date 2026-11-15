import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "./client";

export const ParsedEventSchema = z.object({
  title: z.string(),
  starts_at: z.string(), // ISO string or human-readable fallback
  ends_at: z.string().optional(),
  people: z.array(z.string()).default([]),
  location: z.string().optional(),
  notes: z.string().optional(),
  remind_offsets: z.array(z.number()).default([30, 0]),
  display_time: z.string(), // e.g. "Sunday, 16 Nov, 5:00 PM"
});

export type ParsedEvent = z.infer<typeof ParsedEventSchema>;

/**
 * Deterministic date parser fallback for natural language event strings
 */
export function offlineParseEvent(text: string, referenceDate: Date = new Date()): ParsedEvent {
  const lower = text.toLowerCase();
  let title = text;
  let targetDate = new Date(referenceDate.getTime());
  let displayTime = "Today, 5:00 PM";

  // Check for days of week
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = referenceDate.getDay();

  let targetDayIndex = -1;
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      targetDayIndex = i;
      break;
    }
  }

  if (targetDayIndex !== -1) {
    let diff = targetDayIndex - currentDay;
    if (diff <= 0) diff += 7; // Next occurrence
    targetDate.setDate(targetDate.getDate() + diff);
  } else if (lower.includes("tomorrow")) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Check for time: e.g. "5 pm", "5:30 pm", "17:00"
  let hours = 17;
  let minutes = 0;
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];

    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;

    hours = h;
    minutes = m;
  }

  targetDate.setHours(hours, minutes, 0, 0);

  // Extract people: "with Rahul and Priya"
  const people: string[] = [];
  const withMatch = text.match(/with\s+([A-Za-z0-9\s,]+?)(?=\s+(on|at|tomorrow|next|$))/i);
  if (withMatch) {
    const rawNames = withMatch[1].split(/,|and/);
    for (const name of rawNames) {
      const trimmed = name.trim();
      if (trimmed) people.push(trimmed);
    }
  }

  // Format display time
  const dayName = targetDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = targetDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  displayTime = `${dayName}, ${timeStr}`;

  return {
    title: text.replace(/^(remind me to\s+|remind me\s+|schedule\s+)/i, "").trim(),
    starts_at: targetDate.toISOString(),
    people,
    remind_offsets: [30, 0],
    display_time: displayTime,
  };
}

export async function parseEventNaturalLanguage(
  text: string,
  referenceDate: Date = new Date()
): Promise<ParsedEvent> {
  const trimmed = text.trim();
  const ai = getGeminiClient();

  if (!ai) {
    return offlineParseEvent(trimmed, referenceDate);
  }

  try {
    const model = getGeminiModelName();
    const nowIso = referenceDate.toISOString();
    const prompt = `Current Reference DateTime: ${nowIso}.
Parse the user's natural language event/reminder into a structured JSON event:
User input: "${trimmed}"

Respond STRICTLY with valid JSON:
{
  "title": string,
  "starts_at": ISO8601 string (e.g. 2026-11-16T17:00:00.000Z),
  "ends_at": ISO8601 string or null,
  "people": string[],
  "location": string or null,
  "notes": string or null,
  "remind_offsets": [30, 0],
  "display_time": string (e.g. "Sunday, 16 Nov, 5:00 PM")
}
Do not include markdown fences or other text.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const clean = (response.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return ParsedEventSchema.parse({
      ...parsed,
      location: parsed.location || undefined,
      notes: parsed.notes || undefined,
      ends_at: parsed.ends_at || undefined,
    });
  } catch (error) {
    console.warn("Gemini event parsing failed, falling back to deterministic parser:", error);
    return offlineParseEvent(trimmed, referenceDate);
  }
}
