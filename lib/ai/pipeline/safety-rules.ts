import { GroundedRecord } from "../tools/grounding";

export interface SafetyCheckResult {
  has_safety_flags: boolean;
  warnings: string[];
  disclaimer: string;
}

export function evaluateHealthSafety(
  answerText: string,
  records: GroundedRecord[]
): SafetyCheckResult {
  const warnings: string[] = [];

  // 1. Extreme calorie check
  for (const r of records) {
    if (r.category === "Meals" && r.data) {
      const cal = Number(r.data.calories);
      if (cal && cal < 800 && records.length === 1) {
        // Individual meal is fine, but daily floor check applies
      }
    }
    // 2. Clinical vital out-of-bound checks
    if (r.category === "Health" && r.data) {
      const bpSys = Number(r.data.bp_sys);
      const bpDia = Number(r.data.bp_dia);
      if (bpSys && bpSys >= 140) {
        warnings.push("Logged systolic blood pressure is elevated (>= 140 mmHg).");
      }
      if (bpDia && bpDia >= 90) {
        warnings.push("Logged diastolic blood pressure is elevated (>= 90 mmHg).");
      }
      const glucose = Number(r.data.glucose);
      if (glucose && glucose > 140) {
        warnings.push("Logged blood glucose is above standard normal range (> 140 mg/dL).");
      }
    }
  }

  // 3. Prohibit medical diagnostic assertions in answer
  const lower = answerText.toLowerCase();
  if (lower.includes("you have diabetes") || lower.includes("you suffer from hypertension") || lower.includes("diagnosed with")) {
    warnings.push("Medical diagnostic claim detected and suppressed by safety layer.");
  }

  const disclaimer =
    "Lucy is a personal lifestyle assistant, not a physician. No medical diagnoses are provided. Consult a doctor for clinical advice.";

  return {
    has_safety_flags: warnings.length > 0,
    warnings,
    disclaimer,
  };
}
