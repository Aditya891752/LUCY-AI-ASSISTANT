"use client";

import { useState, useEffect } from "react";
import { Flame, Target, Zap, Clock, ShieldCheck } from "lucide-react";
import { getProfile } from "@/lib/actions/profile";

export default function TodayPage() {
  const [profileData, setProfileData] = useState<{
    calc_baseline?: string;
    goals?: string[];
    targets?: {
      daily_calories: number;
      daily_protein_g: number;
      daily_water_ml: number;
      bmr: number;
      tdee: number;
    };
    wake_time?: string;
    sleep_time?: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getProfile();
      if (data) setProfileData(data);
    }
    load();
  }, []);

  const targets = profileData?.targets || {
    daily_calories: 2200,
    daily_protein_g: 160,
    daily_water_ml: 3000,
    bmr: 1674,
    tdee: 2595,
  };

  const primaryGoal = profileData?.goals?.[0] || "Discipline";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tactical Header */}
      <header className="flex items-center justify-between border-b border-border pb-4">
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
          <span className="text-xs font-bold text-foreground">Day 1</span>
        </div>
      </header>

      {/* Daily Plan Focus Card */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>Active Goal: {primaryGoal}</span>
          </div>
          {profileData?.wake_time && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{profileData.wake_time} - {profileData.sleep_time}</span>
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          Caloric ceiling: {targets.daily_calories} kcal. Protein floor: {targets.daily_protein_g}g. Ground-truth adherence strictly tracked.
        </p>
      </section>

      {/* Macro & Hydration Target Rings Preview */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily Fuel & Targets
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-2 border border-border rounded-md p-3">
            <span className="text-[11px] text-muted-foreground block">Calories</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">0</span>
              <span className="text-xs text-muted-foreground">/ {targets.daily_calories} kcal</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-accent h-full rounded-full w-0" />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-md p-3">
            <span className="text-[11px] text-muted-foreground block">Protein</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">0</span>
              <span className="text-xs text-muted-foreground">/ {targets.daily_protein_g} g</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-fire h-full rounded-full w-0" />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-md p-3">
            <span className="text-[11px] text-muted-foreground block">Hydration</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">0</span>
              <span className="text-xs text-muted-foreground">/ {targets.daily_water_ml} ml</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-accent h-full rounded-full w-0" />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-md p-3">
            <span className="text-[11px] text-muted-foreground block">Habits Done</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">0</span>
              <span className="text-xs text-muted-foreground">/ 4</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-success h-full rounded-full w-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Schedule Card */}
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule & Reminders
        </h2>
        <div className="text-xs text-muted-foreground py-2 text-center border border-dashed border-border rounded-md">
          No scheduled events for today. Use the Command Bar to add a reminder.
        </div>
      </section>
    </div>
  );
}
