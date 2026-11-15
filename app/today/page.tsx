"use client";

import { Flame, Droplets, Target, ShieldCheck } from "lucide-react";

export default function TodayPage() {
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
      <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Target className="w-3.5 h-3.5 text-accent" />
          <span>Priority Focus</span>
        </div>
        <p className="text-sm font-medium text-foreground">
          Hit protein target (160g), complete upper push session, zero unnecessary spend.
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
              <span className="text-xs text-muted-foreground">/ 2,200 kcal</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-accent h-full rounded-full w-0" />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-md p-3">
            <span className="text-[11px] text-muted-foreground block">Protein</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">0</span>
              <span className="text-xs text-muted-foreground">/ 160 g</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-fire h-full rounded-full w-0" />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-md p-3">
            <span className="text-[11px] text-muted-foreground block">Hydration</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">0</span>
              <span className="text-xs text-muted-foreground">/ 3,000 ml</span>
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
