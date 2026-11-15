import { describe, it, expect } from "vitest";
import { calculateBMR, calculateTDEE, calculateTargets } from "../lib/calc/targets";

describe("Target Calculations (Mifflin-St Jeor Engine)", () => {
  it("calculates BMR correctly for Male baseline", () => {
    // 70kg, 175cm, 25 years old
    // 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
    const bmr = calculateBMR("Male", 70, 175, 25);
    expect(bmr).toBe(1674);
  });

  it("calculates BMR correctly for Female baseline", () => {
    // 60kg, 165cm, 28 years old
    // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
    const bmr = calculateBMR("Female", 60, 165, 28);
    expect(bmr).toBe(1330);
  });

  it("calculates BMR correctly for Average baseline", () => {
    // 70kg, 175cm, 25 years old
    // 10*70 + 6.25*175 - 5*25 - 78 = 700 + 1093.75 - 125 - 78 = 1590.75 -> 1591
    const bmr = calculateBMR("Average", 70, 175, 25);
    expect(bmr).toBe(1591);
  });

  it("computes TDEE for moderate activity", () => {
    const tdee = calculateTDEE(1674, "moderate");
    // 1674 * 1.55 = 2594.7 -> 2595
    expect(tdee).toBe(2595);
  });

  it("applies fat loss deficit and ensures safety floor", () => {
    const targets = calculateTargets({
      calc_baseline: "Male",
      weight_kg: 80,
      height_cm: 180,
      age: 30,
      activity_level: "light",
      goals: ["fat loss"],
    });

    // BMR: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    // TDEE: 1780 * 1.375 = 2447.5 -> 2448
    // Fat Loss (80%): 2448 * 0.8 = 1958
    expect(targets.daily_calories).toBe(1958);
    expect(targets.daily_protein_g).toBe(160); // 80kg * 2.0g
    expect(targets.daily_fat_g).toBe(64); // 80kg * 0.8g
    expect(targets.daily_water_ml).toBe(80 * 35 + 500); // 3300ml
  });
});
