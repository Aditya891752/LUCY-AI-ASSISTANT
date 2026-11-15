import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "../client";
import { GroundedRecord } from "../tools/grounding";

export const DraftClaimSchema = z.object({
  id: z.string(),
  text: z.string(),
  cited_record_ids: z.array(z.string()).default([]),
});

export const DraftResponseSchema = z.object({
  claims: z.array(DraftClaimSchema),
  proposed_summary: z.string(),
});

export type DraftResponse = z.infer<typeof DraftResponseSchema>;

export async function generateDraftClaims(
  question: string,
  records: GroundedRecord[]
): Promise<DraftResponse> {
  const ai = getGeminiClient();

  if (!ai || records.length === 0) {
    // Offline deterministic drafter
    const claims = records.map((r, i) => ({
      id: `claim-${i + 1}`,
      text: r.description,
      cited_record_ids: [r.id],
    }));

    return {
      claims,
      proposed_summary: claims.map((c) => c.text).join(". "),
    };
  }

  const model = getGeminiModelName();
  const recordsContext = records
    .map((r) => `[ID: ${r.id}] ${r.description}`)
    .join("\n");

  const prompt = `You are the Drafter agent in a high-integrity personal assistant system.
User Question: "${question}"

AVAILABLE USER RECORDS:
${recordsContext}

INSTRUCTIONS:
1. Break down your answer into individual factual claims.
2. For each claim, cite ONLY the Record IDs that explicitly prove it.
3. If a detail cannot be proven by the records, do not invent it or set cited_record_ids to empty [].
4. Output STRICTLY a JSON object matching this schema:
{
  "claims": [
    {
      "id": string (e.g. "claim-1"),
      "text": string,
      "cited_record_ids": string[]
    }
  ],
  "proposed_summary": string
}
Do not include markdown fences or any other text.`;

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const clean = (res.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return DraftResponseSchema.parse(parsed);
  } catch (err) {
    console.warn("Gemini drafter parse failed, using fallback:", err);
    const fallbackClaims = records.map((r, i) => ({
      id: `claim-${i + 1}`,
      text: r.description,
      cited_record_ids: [r.id],
    }));
    return {
      claims: fallbackClaims,
      proposed_summary: fallbackClaims.map((c) => c.text).join(". "),
    };
  }
}
