import { z } from "zod";
import { getGeminiClient, getGeminiModelName } from "../client";
import { GroundedRecord } from "../tools/grounding";
import { DraftResponse } from "./drafter";

export const ClaimVerdictSchema = z.object({
  claim_id: z.string(),
  verdict: z.enum(["supported", "partially_supported", "unsupported"]),
  reason: z.string(),
});

export const VerificationResultSchema = z.object({
  verdicts: z.array(ClaimVerdictSchema),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export async function verifyClaims(
  draft: DraftResponse,
  records: GroundedRecord[]
): Promise<VerificationResult> {
  const recordsMap = new Map<string, GroundedRecord>();
  for (const r of records) {
    recordsMap.set(r.id, r);
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Offline deterministic verifier
    const verdicts = draft.claims.map((claim) => {
      const hasCitations = claim.cited_record_ids.length > 0;
      const allCitationsExist = claim.cited_record_ids.every((id) => recordsMap.has(id));

      if (hasCitations && allCitationsExist) {
        return {
          claim_id: claim.id,
          verdict: "supported" as const,
          reason: "Cited record IDs match ground-truth storage.",
        };
      } else if (hasCitations) {
        return {
          claim_id: claim.id,
          verdict: "partially_supported" as const,
          reason: "Some cited IDs could not be confirmed.",
        };
      } else {
        return {
          claim_id: claim.id,
          verdict: "unsupported" as const,
          reason: "No record ID cited to support this assertion.",
        };
      }
    });

    return { verdicts };
  }

  const model = getGeminiModelName();

  // Verifier prompt receives ONLY the claims and the exact cited records (blind check)
  const auditContext = draft.claims
    .map((c) => {
      const citedText = c.cited_record_ids
        .map((id) => {
          const rec = recordsMap.get(id);
          return rec ? `[Record ${id}] ${rec.description}` : `[Record ${id}] (NOT FOUND)`;
        })
        .join("; ");

      return `Claim ID: ${c.id}\nStatement: "${c.text}"\nCited Evidence: ${citedText || "None"}\n`;
    })
    .join("\n---\n");

  const prompt = `You are a skeptical, independent Facts Auditor.
Check each claim against its cited evidence ONLY.
Do not assume, hallucinate, or use outside world knowledge.

EVALUATION CRITERIA:
- "supported": The cited evidence explicitly and completely proves the statement.
- "partially_supported": The evidence confirms part of the statement, but some detail is unverified.
- "unsupported": The evidence does NOT prove the statement, or no evidence was cited.

CLAIMS TO AUDIT:
${auditContext}

Respond STRICTLY with a valid JSON object matching:
{
  "verdicts": [
    {
      "claim_id": string,
      "verdict": "supported" | "partially_supported" | "unsupported",
      "reason": string
    }
  ]
}
Do not include markdown fences or any other text.`;

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const clean = (res.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return VerificationResultSchema.parse(parsed);
  } catch (err) {
    console.warn("Verifier LLM call failed, falling back to deterministic verifier:", err);
    const fallbackVerdicts = draft.claims.map((claim) => ({
      claim_id: claim.id,
      verdict: (claim.cited_record_ids.length > 0 ? "supported" : "unsupported") as "supported" | "unsupported",
      reason: "Fallback verification based on presence of database row citations.",
    }));
    return { verdicts: fallbackVerdicts };
  }
}
