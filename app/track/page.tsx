"use client";

import { useState } from "react";
import { Utensils, HeartPulse, Dumbbell, Sparkles, Check, AlertCircle, Plus, Flame } from "lucide-react";
import { estimateMealMacros, MealEstimate } from "@/lib/ai/meals";
import { logMeal, logVitals, logWorkout } from "@/lib/actions/trackers";
import { cn } from "@/lib/utils";

type TrackTab = "meals" | "vitals" | "workouts";

export default function TrackPage() {
  const [activeTab, setActiveTab] = useState<TrackTab>("meals");

  // Meal Tracker State
  const [mealText, setMealText] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimate, setEstimate] = useState<MealEstimate | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const [mealSavedMsg, setMealSavedMsg] = useState(false);

  // Vitals State
  const [weight, setWeight] = useState("72");
  const [sleep, setSleep] = useState("7.5");
  const [steps, setSteps] = useState("8500");
  const [mood, setMood] = useState("4");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [glucose, setGlucose] = useState("");
  const [vitalsSavedMsg, setVitalsSavedMsg] = useState(false);
  const [vitalAlert, setVitalAlert] = useState<string | null>(null);

  // Workouts State
  const [exercise, setExercise] = useState("Barbell Bench Press");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("8");
  const [weightKg, setWeightKg] = useState("80");
  const [durationMin, setDurationMin] = useState("45");
  const [workoutSavedMsg, setWorkoutSavedMsg] = useState(false);

  // Handle Meal Estimation
  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealText.trim()) return;

    setIsEstimating(true);
    setMealSavedMsg(false);
    try {
      const res = await estimateMealMacros(mealText);
      setEstimate(res);
      setIsEdited(false);
    } catch {
      alert("Failed to estimate meal. Please check input.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!estimate) return;
    await logMeal({
      description: estimate.description,
      calories: estimate.calories,
      protein_g: estimate.protein_g,
      carbs_g: estimate.carbs_g,
      fat_g: estimate.fat_g,
      user_edited: isEdited,
    });
    setMealSavedMsg(true);
    setEstimate(null);
    setMealText("");
    setTimeout(() => setMealSavedMsg(false), 3000);
  };

  // Handle Vitals Save
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await logVitals({
      weight_kg: parseFloat(weight) || undefined,
      sleep_h: parseFloat(sleep) || undefined,
      steps: parseInt(steps) || undefined,
      mood: parseInt(mood) || undefined,
      bp_sys: bpSys ? parseInt(bpSys) : undefined,
      bp_dia: bpDia ? parseInt(bpDia) : undefined,
      glucose: glucose ? parseInt(glucose) : undefined,
    });

    setVitalAlert(res.vitals.medical_alert || null);
    setVitalsSavedMsg(true);
    setTimeout(() => setVitalsSavedMsg(false), 3000);
  };

  // Handle Workout Save
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    await logWorkout({
      exercise,
      sets: parseInt(sets) || 1,
      reps: parseInt(reps) || 1,
      weight_kg: parseFloat(weightKg) || 0,
      duration_min: parseInt(durationMin) || 0,
    });
    setWorkoutSavedMsg(true);
    setTimeout(() => setWorkoutSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <header className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
            Permanent Ground Truth
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Track Activity
          </h1>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="flex bg-surface-1 border border-border rounded-lg p-1 gap-1">
        {[
          { id: "meals", label: "Meals", icon: Utensils },
          { id: "vitals", label: "Health Vitals", icon: HeartPulse },
          { id: "workouts", label: "Workouts", icon: Dumbbell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TrackTab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-semibold transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. MEAL TRACKER */}
      {activeTab === "meals" && (
        <div className="space-y-4">
          <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Natural Language Meal Parsing</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Type or speak what you ate (*e.g. &quot;2 rotis, dal, paneer sabzi&quot;*). Gemini calculates calories and macros.
            </p>

            <form onSubmit={handleEstimate} className="space-y-3">
              <textarea
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                placeholder="2 rotis, bowl of dal, 100g paneer sabzi, glass of lassi..."
                rows={3}
                className="w-full bg-surface-2 border border-border rounded p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={isEstimating || !mealText.trim()}
                className="w-full bg-surface-2 border border-border hover:border-border-active text-xs font-semibold py-2.5 rounded text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                {isEstimating ? "Estimating Nutrition..." : "Estimate with Gemini"}
              </button>
            </form>
          </div>

          {/* ESTIMATION PREVIEW & MANUAL EDIT CARD */}
          {estimate && (
            <div className="bg-surface-1 border border-accent/40 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground">
                  Nutritional Breakdown Review
                </span>
                {isEdited && (
                  <span className="text-[10px] bg-fire/20 text-fire px-2 py-0.5 rounded font-semibold">
                    User Edited
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase block">Calories</label>
                  <input
                    type="number"
                    value={estimate.calories}
                    onChange={(e) => {
                      setIsEdited(true);
                      setEstimate({ ...estimate, calories: parseInt(e.target.value) || 0 });
                    }}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs font-bold tabular-nums text-foreground focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase block">Protein (g)</label>
                  <input
                    type="number"
                    value={estimate.protein_g}
                    onChange={(e) => {
                      setIsEdited(true);
                      setEstimate({ ...estimate, protein_g: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs font-bold tabular-nums text-fire focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase block">Carbs (g)</label>
                  <input
                    type="number"
                    value={estimate.carbs_g}
                    onChange={(e) => {
                      setIsEdited(true);
                      setEstimate({ ...estimate, carbs_g: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs font-bold tabular-nums text-accent focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase block">Fat (g)</label>
                  <input
                    type="number"
                    value={estimate.fat_g}
                    onChange={(e) => {
                      setIsEdited(true);
                      setEstimate({ ...estimate, fat_g: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs font-bold tabular-nums text-foreground focus:border-accent"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                Rule: You can edit any value. User-edited numbers permanently supersede AI estimates.
              </p>

              <button
                type="button"
                onClick={handleSaveMeal}
                className="w-full bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded hover:bg-accent/90 active:scale-98 transition-transform"
              >
                Confirm & Log to Ground Truth
              </button>
            </div>
          )}

          {mealSavedMsg && (
            <div className="bg-success/15 border border-success text-success text-xs p-3 rounded flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Meal successfully committed to database and daily rings updated!</span>
            </div>
          )}
        </div>
      )}

      {/* 2. VITALS TRACKER */}
      {activeTab === "vitals" && (
        <form onSubmit={handleSaveVitals} className="space-y-4">
          <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Daily Health & Biological Vitals
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Morning Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Sleep Duration (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Manual Step Count</label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Mood Score (1 to 5)</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs text-foreground focus:border-accent"
                >
                  <option value="1">1 - Exhausted / Rough</option>
                  <option value="2">2 - Low Energy</option>
                  <option value="3">3 - Disciplined Baseline</option>
                  <option value="4">4 - High Focus</option>
                  <option value="5">5 - Peak Winter Arc</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                Clinical Vitals (Optional)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">BP Systolic</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">BP Diastolic</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Glucose (mg/dL)</label>
                  <input
                    type="number"
                    placeholder="95"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {vitalAlert && (
              <div className="bg-fire/15 border border-fire text-fire text-xs p-3 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">{vitalAlert}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded hover:bg-accent/90 active:scale-98 transition-transform"
            >
              Commit Health Vitals
            </button>
          </div>

          {vitalsSavedMsg && (
            <div className="bg-success/15 border border-success text-success text-xs p-3 rounded flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Vitals logged successfully.</span>
            </div>
          )}
        </form>
      )}

      {/* 3. WORKOUTS TRACKER */}
      {activeTab === "workouts" && (
        <form onSubmit={handleSaveWorkout} className="space-y-4">
          <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Winter Arc Training Session Log
            </h2>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Exercise Name</label>
              <input
                type="text"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                required
                className="w-full bg-surface-2 border border-border rounded p-2 text-xs text-foreground focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Sets</label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Time (min)</label>
                <input
                  type="number"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-xs tabular-nums text-foreground focus:border-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded hover:bg-accent/90 active:scale-98 transition-transform"
            >
              Save Workout Log
            </button>
          </div>

          {workoutSavedMsg && (
            <div className="bg-success/15 border border-success text-success text-xs p-3 rounded flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Workout session logged to your records.</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
