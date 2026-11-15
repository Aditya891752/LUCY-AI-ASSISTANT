"use client";

import { useState, useEffect } from "react";
import { Flame, Target, Droplets, Plus, Check, Clock, Dumbbell, Utensils } from "lucide-react";
import { getProfile } from "@/lib/actions/profile";
import { getTodaySummary, logWater, toggleHabit, DaySummary } from "@/lib/actions/trackers";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const [profileData, setProfileData] = useState<{
    goals?: string[];
    targets?: {
      daily_calories: number;
      daily_protein_g: number;
      daily_carbs_g: number;
      daily_fat_g: number;
      daily_water_ml: number;
    };
    wake_time?: string;
    sleep_time?: string;
  } | null>(null);

  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    const [profile, sum] = await Promise.all([getProfile(), getTodaySummary()]);
    if (profile) setProfileData(profile);
    if (sum) setSummary(sum);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleWaterAdd = async (amount: number) => {
    if (!summary) return;
    // Optimistic update
    setSummary((prev) =>
      prev ? { ...prev, consumed_water_ml: prev.consumed_water_ml + amount } : null
    );
    await logWater(amount);
    refreshData();
  };

  const handleHabitToggle = async (habitId: string) => {
    if (!summary) return;
    // Optimistic update
    setSummary((prev) => {
      if (!prev) return null;
      const updated = prev.habits.map((h) =>
        h.id === habitId ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : h.streak - 1 } : h
      );
      return {
        ...prev,
        habits: updated,
        completed_habits_count: updated.filter((h) => h.done).length,
      };
    });
    await toggleHabit(habitId);
    refreshData();
  };

  const targets = profileData?.targets || {
    daily_calories: 2200,
    daily_protein_g: 160,
    daily_carbs_g: 220,
    daily_fat_g: 65,
    daily_water_ml: 3000,
  };

  const consumedCalories = summary?.consumed_calories || 0;
  const consumedProtein = summary?.consumed_protein_g || 0;
  const consumedWater = summary?.consumed_water_ml || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tactical Header */}
      <header className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
            Winter Arc Protocol
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Today Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-2 border border-border px-3 py-1.5 rounded-full">
          <Flame className="w-4 h-4 text-fire fill-fire" />
          <span className="text-xs font-bold text-foreground">
            Streak Active
          </span>
        </div>
      </header>

      {/* Routine & Priority Focus Banner */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>Winter Arc Targets</span>
          </div>
          {profileData?.wake_time && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {profileData.wake_time} - {profileData.sleep_time}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          Caloric ceiling: {targets.daily_calories} kcal. Protein floor: {targets.daily_protein_g}g. Hydration target: {targets.daily_water_ml}ml.
        </p>
      </section>

      {/* CIRCULAR MACRO & HYDRATION RINGS */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily Fuel & Hydration Rings
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <ProgressRing
            value={consumedCalories}
            max={targets.daily_calories}
            label="Calories"
            unit="kcal"
            colorClass="text-accent"
          />
          <ProgressRing
            value={consumedProtein}
            max={targets.daily_protein_g}
            label="Protein"
            unit="g"
            colorClass="text-fire"
          />
          <ProgressRing
            value={consumedWater}
            max={targets.daily_water_ml}
            label="Water"
            unit="ml"
            colorClass="text-accent"
          />
        </div>

        {/* Quick Water Action Buttons */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-accent" />
            Quick Hydrate
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleWaterAdd(250)}
              className="bg-surface-2 border border-border hover:border-border-active text-xs font-medium px-2.5 py-1 rounded text-foreground active:scale-95 transition-transform"
            >
              +250 ml
            </button>
            <button
              onClick={() => handleWaterAdd(500)}
              className="bg-surface-2 border border-border hover:border-border-active text-xs font-medium px-2.5 py-1 rounded text-foreground active:scale-95 transition-transform"
            >
              +500 ml
            </button>
          </div>
        </div>
      </section>

      {/* DISCIPLINE HABITS CHECKLIST */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Discipline & Habit Tracker
          </h2>
          <span className="text-xs font-bold text-foreground tabular-nums">
            {summary?.completed_habits_count || 0} / {summary?.total_habits_count || 4} Completed
          </span>
        </div>

        <div className="space-y-2">
          {summary?.habits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => handleHabitToggle(habit.id)}
              className={cn(
                "p-3 rounded border flex items-center justify-between cursor-pointer transition-colors active:scale-98",
                habit.done
                  ? "bg-surface-2/90 border-success/40"
                  : "bg-surface-2/40 border-border hover:border-border-active"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                    habit.done
                      ? "bg-success border-success text-black"
                      : "border-border bg-surface-1"
                  )}
                >
                  {habit.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    habit.done ? "line-through text-muted-foreground" : "text-foreground"
                  )}
                >
                  {habit.name}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-fire">
                <Flame className="w-3.5 h-3.5 fill-fire" />
                <span className="tabular-nums">{habit.streak}d</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOGGED MEALS & WORKOUTS HISTORY */}
      {summary && (summary.meals.length > 0 || summary.workouts.length > 0) && (
        <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Logged Today ({summary.meals.length} Meals, {summary.workouts.length} Workouts)
          </h2>

          <div className="space-y-2">
            {summary.meals.map((m) => (
              <div
                key={m.id}
                className="bg-surface-2/50 border border-border p-2.5 rounded text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-accent" />
                  <span className="text-foreground font-medium">{m.description}</span>
                  {m.user_edited && (
                    <span className="text-[9px] bg-fire/20 text-fire px-1.5 py-0.2 rounded font-semibold">
                      Edited
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                  <span>{m.calories} kcal</span>
                  <span>•</span>
                  <span className="text-fire">{m.protein_g}g P</span>
                </div>
              </div>
            ))}

            {summary.workouts.map((w) => (
              <div
                key={w.id}
                className="bg-surface-2/50 border border-border p-2.5 rounded text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-accent" />
                  <span className="text-foreground font-medium">{w.exercise}</span>
                </div>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {w.sets}x{w.reps} @ {w.weight_kg}kg
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
