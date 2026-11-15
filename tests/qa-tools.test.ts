import { describe, it, expect, vi } from "vitest";

// Mock next/headers for vitest environment
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: (key: string) => {
      if (key === "lucy_today_meals") {
        return {
          value: JSON.stringify([
            { id: "m-1", description: "2 rotis and dal", calories: 350, protein_g: 15, carbs_g: 45, fat_g: 8, eaten_at: "2026-11-15T12:00:00Z" },
          ]),
        };
      }
      return null;
    },
    set: () => {},
  }),
}));

import { executeGroundingQueries } from "../lib/ai/tools/grounding";

describe("Ask-Your-Data Grounding Tools", () => {
  it("routes meal question to Meals category and retrieves exact row", async () => {
    const results = await executeGroundingQueries("What did I eat for lunch?");
    const mealResult = results.find((r) => r.category === "Meals");
    const notesResult = results.find((r) => r.category === "Notes");

    expect(mealResult).toBeDefined();
    expect(mealResult?.records.length).toBeGreaterThan(0);
    expect(mealResult?.records[0].description).toContain("2 rotis and dal");
    expect(notesResult).toBeDefined();
  });

  it("routes meeting question to Schedule category", async () => {
    const results = await executeGroundingQueries("When is my meeting with Rahul?");
    const scheduleResult = results.find((r) => r.category === "Schedule");

    expect(scheduleResult).toBeDefined();
  });

  it("routes financial query to Money category", async () => {
    const results = await executeGroundingQueries("How much money have I spent on groceries?");
    const moneyResult = results.find((r) => r.category === "Money");

    expect(moneyResult).toBeDefined();
  });
});
