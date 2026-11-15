"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, ArrowLeft, Check, Sparkles, Target, Zap } from "lucide-react";
import { ProfileFormData } from "@/lib/validations/profile";
import { calculateTargets } from "@/lib/calc/targets";
import { saveProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", desc: "Desk job, little to no exercise" },
  { value: "light", label: "Lightly Active", desc: "1-3 light sessions per week" },
  { value: "moderate", label: "Moderately Active", desc: "3-5 moderate workouts per week" },
  { value: "very_active", label: "Very Active", desc: "6-7 hard workouts per week" },
  { value: "extra_active", label: "Extremely Active", desc: "Heavy physical labor / 2x daily training" },
] as const;

const GOAL_OPTIONS = [
  { id: "fat loss", label: "Fat Loss", desc: "20% calibrated caloric deficit" },
  { id: "muscle gain", label: "Muscle Gain", desc: "Lean surplus with high protein" },
  { id: "maintenance", label: "Maintenance", desc: "Sustain composition & peak performance" },
  { id: "discipline", label: "Discipline", desc: "Winter Arc routine & habit adherence" },
  { id: "savings", label: "Savings", desc: "Financial runway & budget limits" },
] as const;

const DIET_OPTIONS = [
  { value: "veg", label: "Vegetarian" },
  { value: "non-veg", label: "Non-Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    gender: "Male",
    calc_baseline: "Male",
    age: 25,
    height_cm: 175,
    weight_kg: 72,
    activity_level: "moderate",
    goals: ["discipline", "fat loss"],
    diet_pref: "non-veg",
    allergies: [],
    wake_time: "06:30",
    sleep_time: "22:30",
    timezone: "UTC",
  });

  const [allergyInput, setAllergyInput] = useState("");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setFormData((prev) => ({ ...prev, timezone: tz }));
      }
    } catch {
      // Keep default
    }
  }, []);

  const handleGenderSelect = (gender: ProfileFormData["gender"]) => {
    let baseline: ProfileFormData["calc_baseline"] = "Average";
    if (gender === "Male") baseline = "Male";
    if (gender === "Female") baseline = "Female";

    setFormData((prev) => ({
      ...prev,
      gender,
      calc_baseline: baseline,
    }));
  };

  const toggleGoal = (goalId: ProfileFormData["goals"][number]) => {
    setFormData((prev) => {
      const exists = prev.goals.includes(goalId);
      if (exists) {
        if (prev.goals.length === 1) return prev; // Keep at least one
        return { ...prev, goals: prev.goals.filter((g) => g !== goalId) };
      } else {
        return { ...prev, goals: [...prev.goals, goalId] };
      }
    });
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (!trimmed) return;
    if (!formData.allergies.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, allergies: [...prev.allergies, trimmed] }));
    }
    setAllergyInput("");
  };

  const removeAllergy = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== item),
    }));
  };

  const targets = calculateTargets({
    calc_baseline: formData.calc_baseline,
    weight_kg: formData.weight_kg,
    height_cm: formData.height_cm,
    age: formData.age,
    activity_level: formData.activity_level,
    goals: formData.goals,
  });

  const handleComplete = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await saveProfile(formData);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to save profile. Please review your details.");
        setIsSaving(false);
        return;
      }

      router.push("/today");
      router.refresh();
    } catch {
      setErrorMsg("An unexpected network error occurred. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header & Step Indicator */}
      <div className="space-y-2 text-center">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
          Winter Arc Protocol Initiation
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Step {step} of 4:{" "}
          {step === 1 && "Identity & Baseline"}
          {step === 2 && "Biometrics & Output"}
          {step === 3 && "Goals & Fuel"}
          {step === 4 && "Daily Rhythm"}
        </h1>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 pt-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 rounded-full transition-colors",
                s <= step ? "bg-accent" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-danger/10 border border-danger text-danger text-xs p-3 rounded-md">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: IDENTITY & CALCULATION BASELINE */}
      {step === 1 && (
        <div className="bg-surface-1 border border-border rounded-lg p-5 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Gender Selection</h2>
            <p className="text-xs text-muted-foreground">
              Select your gender. This establishes your metabolic baseline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["Male", "Female", "Other", "Prefer not to say"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenderSelect(g)}
                className={cn(
                  "p-3 rounded-md text-xs font-semibold border text-left transition-colors",
                  formData.gender === g
                    ? "bg-surface-2 border-accent text-accent"
                    : "bg-surface-2/40 border-border text-foreground hover:border-border-active"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Follow-up for Other / Prefer not to say */}
          {(formData.gender === "Other" || formData.gender === "Prefer not to say") && (
            <div className="pt-3 border-t border-border space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Which calculation baseline should we use?
              </label>
              <p className="text-[11px] text-muted-foreground">
                Required for accurate Mifflin-St Jeor calorie and health formula math.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["Male", "Female", "Average"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, calc_baseline: b }))}
                    className={cn(
                      "py-2 px-3 rounded text-xs font-medium border text-center transition-colors",
                      formData.calc_baseline === b
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-surface-2 border-border text-foreground hover:border-border-active"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: BIOMETRICS & ACTIVITY */}
      {step === 2 && (
        <div className="bg-surface-1 border border-border rounded-lg p-5 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Body Metrics</h2>
            <p className="text-xs text-muted-foreground">
              Accurate height and weight ensure precise metabolic expenditure.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Age (years)</label>
              <input
                type="number"
                min={14}
                max={100}
                value={formData.age}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, age: parseInt(e.target.value) || 25 }))
                }
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Height (cm)</label>
              <input
                type="number"
                min={100}
                max={250}
                value={formData.height_cm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, height_cm: parseFloat(e.target.value) || 175 }))
                }
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Weight (kg)</label>
              <input
                type="number"
                min={30}
                max={300}
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight_kg: parseFloat(e.target.value) || 70 }))
                }
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground block">
              Physical Activity Level
            </label>
            <div className="space-y-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, activity_level: opt.value }))}
                  className={cn(
                    "w-full p-2.5 rounded border text-left transition-colors flex items-center justify-between",
                    formData.activity_level === opt.value
                      ? "bg-surface-2 border-accent"
                      : "bg-surface-2/40 border-border hover:border-border-active"
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                  </div>
                  {formData.activity_level === opt.value && (
                    <Check className="w-4 h-4 text-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: GOALS & FUEL */}
      {step === 3 && (
        <div className="bg-surface-1 border border-border rounded-lg p-5 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Winter Arc Focus Goals</h2>
            <p className="text-xs text-muted-foreground">
              Select all targets you want Lucy to optimize for your weekly plan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {GOAL_OPTIONS.map((g) => {
              const selected = formData.goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={cn(
                    "p-3 rounded border text-left flex items-center justify-between transition-colors",
                    selected
                      ? "bg-surface-2 border-accent"
                      : "bg-surface-2/40 border-border hover:border-border-active"
                  )}
                >
                  <div>
                    <span className="text-xs font-semibold text-foreground block">{g.label}</span>
                    <span className="text-[11px] text-muted-foreground">{g.desc}</span>
                  </div>
                  {selected && <Check className="w-4 h-4 text-accent" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <label className="text-xs font-semibold text-foreground block">Diet Preference</label>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, diet_pref: d.value }))}
                  className={cn(
                    "py-2 px-3 rounded text-xs font-medium border text-center transition-colors",
                    formData.diet_pref === d.value
                      ? "bg-accent text-accent-foreground border-accent font-semibold"
                      : "bg-surface-2 border-border text-foreground hover:border-border-active"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <label className="text-xs font-semibold text-foreground block">
              Allergies or Intolerances (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
                placeholder="Peanuts, lactose, shellfish..."
                className="flex-1 bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="bg-surface-2 border border-border hover:border-border-active text-xs font-medium px-3 py-1.5 rounded text-foreground"
              >
                Add
              </button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.allergies.map((a) => (
                  <span
                    key={a}
                    onClick={() => removeAllergy(a)}
                    className="inline-flex items-center gap-1 bg-surface-2 border border-border px-2 py-0.5 rounded text-[11px] text-foreground cursor-pointer hover:border-danger hover:text-danger"
                  >
                    {a} ✕
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: ROUTINE & TARGETS REVEAL */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-surface-1 border border-border rounded-lg p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">Circadian Rhythm & Timezone</h2>
              <p className="text-xs text-muted-foreground">
                Sets reminder trigger windows and sleep tracking boundaries.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Wake Time</label>
                <input
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, wake_time: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Sleep Time</label>
                <input
                  type="time"
                  value={formData.sleep_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sleep_time: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-medium text-muted-foreground">Detected Timezone</label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* CALCULATED BASELINE TARGETS PREVIEW */}
          <div className="bg-surface-1 border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Calculated Winter Arc Baselines</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-surface-2 border border-border p-3 rounded">
                <span className="text-[10px] uppercase text-muted-foreground block">Daily Calories</span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {targets.daily_calories}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">kcal</span>
              </div>

              <div className="bg-surface-2 border border-border p-3 rounded">
                <span className="text-[10px] uppercase text-muted-foreground block">Daily Protein</span>
                <span className="text-lg font-bold text-fire tabular-nums">
                  {targets.daily_protein_g}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">grams</span>
              </div>

              <div className="bg-surface-2 border border-border p-3 rounded">
                <span className="text-[10px] uppercase text-muted-foreground block">Hydration Target</span>
                <span className="text-lg font-bold text-accent tabular-nums">
                  {targets.daily_water_ml}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">ml</span>
              </div>

              <div className="bg-surface-2 border border-border p-3 rounded">
                <span className="text-[10px] uppercase text-muted-foreground block">Est. BMR / TDEE</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {targets.bmr} / {targets.tdee}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">kcal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground bg-surface-2 border border-border transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded text-xs font-semibold text-accent-foreground bg-accent hover:bg-accent/90 active:scale-98 transition-transform"
          >
            Next Step
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-2.5 rounded text-xs font-semibold text-accent-foreground bg-accent hover:bg-accent/90 active:scale-98 transition-transform disabled:opacity-50"
          >
            {isSaving ? "Locking in Protocol..." : "Activate Lucy"}
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-center pt-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Shield className="w-3 h-3 text-success" />
          Data is stored in your private database and protected by Row Level Security.
        </span>
      </div>
    </div>
  );
}
