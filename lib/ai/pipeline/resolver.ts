export interface ClaimVerificationItem {
  id: string;
  claim: string;
  cited_record_ids: string[];
  verdict: "supported" | "partially_supported" | "unsupported";
  reason?: string;
}

export interface VerificationResolveResult {
  is_verified: boolean;
  resolved_text: string;
  verified_claims: string[];
  unsupported_claims: string[];
  support_rate: number;
}

export function resolveVerifiedClaims(
  claims: ClaimVerificationItem[]
): VerificationResolveResult {
  if (!claims || claims.length === 0) {
    return {
      is_verified: false,
      resolved_text: "No records found to verify this answer.",
      verified_claims: [],
      unsupported_claims: [],
      support_rate: 0,
    };
  }

  const supported = claims.filter(
    (c) => c.verdict === "supported" || c.verdict === "partially_supported"
  );
  const unsupported = claims.filter((c) => c.verdict === "unsupported");
  const supportRate = supported.length / claims.length;

  // If more than 50% of claims are unsupported, refuse to speculate
  if (supportRate < 0.5) {
    return {
      is_verified: false,
      resolved_text: "I couldn't verify enough to answer from your records.",
      verified_claims: supported.map((c) => c.claim),
      unsupported_claims: unsupported.map((c) => c.claim),
      support_rate: supportRate,
    };
  }

  // Synthesize verified claims; explicitly note any unverified parts
  const sentences: string[] = [];
  for (const item of supported) {
    if (item.verdict === "partially_supported") {
      sentences.push(`${item.claim} (note: partially confirmed in records)`);
    } else {
      sentences.push(item.claim);
    }
  }

  if (unsupported.length > 0) {
    sentences.push(
      `Additional details (${unsupported.map((u) => u.claim).join("; ")}) are not in your records.`
    );
  }

  return {
    is_verified: true,
    resolved_text: sentences.join(" "),
    verified_claims: supported.map((c) => c.claim),
    unsupported_claims: unsupported.map((c) => c.claim),
    support_rate: supportRate,
  };
}
