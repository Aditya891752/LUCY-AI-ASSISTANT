import { describe, it, expect } from "vitest";
import { resolveVerifiedClaims, ClaimVerificationItem } from "../lib/ai/pipeline/resolver";

describe("Double Verification Resolver", () => {
  it("resolves fully supported claims into verified output", () => {
    const claims: ClaimVerificationItem[] = [
      {
        id: "1",
        claim: "You logged 2 rotis and paneer sabzi on Tuesday.",
        cited_record_ids: ["meal-uuid-1"],
        verdict: "supported",
      },
      {
        id: "2",
        claim: "Your protein intake for that meal was 24 grams.",
        cited_record_ids: ["meal-uuid-1"],
        verdict: "supported",
      },
    ];

    const result = resolveVerifiedClaims(claims);
    expect(result.is_verified).toBe(true);
    expect(result.support_rate).toBe(1);
    expect(result.resolved_text).toContain("You logged 2 rotis and paneer sabzi");
  });

  it("handles unsupported claims gracefully and flags them as not in records", () => {
    const claims: ClaimVerificationItem[] = [
      {
        id: "1",
        claim: "You completed an upper push workout on Monday.",
        cited_record_ids: ["workout-uuid-1"],
        verdict: "supported",
      },
      {
        id: "2",
        claim: "You had a meeting with Alex at 3pm.",
        cited_record_ids: [],
        verdict: "unsupported",
      },
    ];

    const result = resolveVerifiedClaims(claims);
    expect(result.is_verified).toBe(true);
    expect(result.resolved_text).toContain("upper push workout");
    expect(result.resolved_text).toContain("not in your records");
  });

  it("fails safely if majority of claims cannot be verified (> 50% unsupported)", () => {
    const claims: ClaimVerificationItem[] = [
      {
        id: "1",
        claim: "You ran 5 kilometers on Wednesday.",
        cited_record_ids: [],
        verdict: "unsupported",
      },
      {
        id: "2",
        claim: "You ate oatmeal for breakfast.",
        cited_record_ids: [],
        verdict: "unsupported",
      },
      {
        id: "3",
        claim: "You weighed 74kg.",
        cited_record_ids: ["health-uuid-1"],
        verdict: "supported",
      },
    ];

    const result = resolveVerifiedClaims(claims);
    expect(result.is_verified).toBe(false);
    expect(result.resolved_text).toBe("I couldn't verify enough to answer from your records.");
  });
});
