import { describe, it, expect, vi } from "vitest";

// Mock next/headers for vitest environment
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: () => null,
    set: () => {},
  }),
}));

import { runDoubleVerificationPipeline } from "../lib/ai/pipeline/engine";
import { GroundedRecord } from "../lib/ai/tools/grounding";

describe("Complete 7-Stage Double Verification Pipeline", () => {
  it("verifies grounded records, computes math deterministically, and appends safety disclaimers", async () => {
    const records: GroundedRecord[] = [
      {
        id: "rec-meal-1",
        category: "Meals",
        description: "2 rotis and paneer sabzi (450 kcal, 22g protein)",
        date: "2026-11-15T12:30:00Z",
        data: { calories: 450, protein_g: 22 },
      },
      {
        id: "rec-meal-2",
        category: "Meals",
        description: "Whey protein shake (150 kcal, 25g protein)",
        date: "2026-11-15T16:00:00Z",
        data: { calories: 150, protein_g: 25 },
      },
    ];

    const result = await runDoubleVerificationPipeline("What did I eat today?", records);

    expect(result.is_verified).toBe(true);
    expect(result.cited_records.length).toBeGreaterThan(0);
    // Verifies server-calculated totals (450 + 150 = 600 kcal, 22 + 25 = 47g protein)
    expect(result.server_math_note).toContain("600 kcal");
    expect(result.server_math_note).toContain("47g protein");
    // Verifies medical disclaimer
    expect(result.final_answer).toContain("not a physician");
  });

  it("safely handles empty records without speculating", async () => {
    const result = await runDoubleVerificationPipeline("What did I do in 2020?", []);

    expect(result.is_verified).toBe(false);
    expect(result.final_answer).toContain("couldn't find any relevant ground-truth records");
    expect(result.cited_records.length).toBe(0);
  });
});
