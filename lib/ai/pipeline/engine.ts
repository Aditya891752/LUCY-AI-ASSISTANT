import { GroundedRecord } from "../tools/grounding";
import { generateDraftClaims } from "./drafter";
import { verifyClaims } from "./verifier";
import { resolveVerifiedClaims, ClaimVerificationItem } from "./resolver";
import { verifyAndComputeMath } from "./math-check";
import { evaluateHealthSafety } from "./safety-rules";
import { logAIAudit } from "./audit";

export interface PipelineExecutionResult {
  is_verified: boolean;
  final_answer: string;
  cited_records: GroundedRecord[];
  claims_audit: ClaimVerificationItem[];
  support_rate: number;
  safety_warnings: string[];
  server_math_note?: string;
}

export async function runDoubleVerificationPipeline(
  question: string,
  records: GroundedRecord[]
): Promise<PipelineExecutionResult> {
  // If zero ground truth records exist
  if (records.length === 0) {
    const fallbackAnswer = "I couldn't find any relevant ground-truth records matching your question.";
    await logAIAudit({
      question,
      draft_answer: { claims: [] },
      verification_result: { verdicts: [] },
      final_answer: { text: fallbackAnswer, reason: "No records found" },
    });

    return {
      is_verified: false,
      final_answer: fallbackAnswer,
      cited_records: [],
      claims_audit: [],
      support_rate: 0,
      safety_warnings: [],
    };
  }

  // Stage 1: Drafter pass
  const draft = await generateDraftClaims(question, records);

  // Stage 2: Independent Verifier pass
  const verification = await verifyClaims(draft, records);

  // Map into ClaimVerificationItems for resolution
  const verificationMap = new Map(verification.verdicts.map((v) => [v.claim_id, v]));

  const claimItems: ClaimVerificationItem[] = draft.claims.map((c) => {
    const verdictObj = verificationMap.get(c.id);
    return {
      id: c.id,
      claim: c.text,
      cited_record_ids: c.cited_record_ids,
      verdict: verdictObj?.verdict || "unsupported",
      reason: verdictObj?.reason,
    };
  });

  // Stage 3: Resolve claims & eliminate unsupported assertions
  const resolved = resolveVerifiedClaims(claimItems);

  // Stage 4: Deterministic code math check
  const mathCheck = verifyAndComputeMath(records);
  let finalAnswer = resolved.resolved_text;

  if (mathCheck.has_numeric_adjustments && mathCheck.note) {
    finalAnswer += `\n\n${mathCheck.note}`;
  }

  // Stage 5: Health & Safety Rule check
  const safety = evaluateHealthSafety(finalAnswer, records);
  if (safety.has_safety_flags) {
    finalAnswer += `\n\nHealth Notice: ${safety.warnings.join(" ")}`;
  }
  finalAnswer += `\n\n${safety.disclaimer}`;

  // Filter cited records to only those supporting verified claims
  const verifiedClaimItems = claimItems.filter((c) => c.verdict !== "unsupported");
  const citedIds = new Set(verifiedClaimItems.flatMap((c) => c.cited_record_ids));
  const cited_records = records.filter((r) => citedIds.has(r.id));

  // Stage 6: Full Audit Logging
  await logAIAudit({
    question,
    draft_answer: draft as unknown as Record<string, unknown>,
    verification_result: verification as unknown as Record<string, unknown>,
    final_answer: {
      text: finalAnswer,
      support_rate: resolved.support_rate,
      is_verified: resolved.is_verified,
    },
  });

  return {
    is_verified: resolved.is_verified,
    final_answer: finalAnswer,
    cited_records: cited_records.length > 0 ? cited_records : records,
    claims_audit: claimItems,
    support_rate: resolved.support_rate,
    safety_warnings: safety.warnings,
    server_math_note: mathCheck.note,
  };
}
