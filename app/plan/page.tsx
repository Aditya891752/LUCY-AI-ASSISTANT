"use client";

import { useState, useEffect } from "react";
import { Compass, ShieldCheck, Sparkles, Check, Dumbbell, Utensils, Flame, DollarSign, RefreshCw, CalendarCheck } from "lucide-react";
import { getActivePlan, generateAndSavePlan, toggleDayCompleted, toggleSupplementCompleted, toggleChecklistCompleted } from "@/lib/actions/plans";
import { WeeklyPlan } from "@/lib/ai/planner";
import { cn } from "@/lib/utils";

export default function PlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadPlan = async () => {
    const res = await getActivePlan();
    setPlan(res);
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateAndSavePlan();
      setPlan(res);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleDay = async (index: number) => {
    if (!plan) return;
    // Optimistic toggle
    setPlan((prev) => {
      if (!prev) return null;
      const updatedDays = [...prev.days];
      updatedDays[index] = { ...updatedDays[index], completed: !updatedDays[index].completed };
      return { ...prev, days: updatedDays };
    });
    await toggleDayCompleted(index);
  };

  const handleToggleSup = async (id: string) => {
    if (!plan) return;
    setPlan((prev) => {
      if (!prev) return null;
      const updated = prev.supplements_schedule.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s
      );
      return { ...prev, supplements_schedule: updated };
    });
    await toggleSupplementCompleted(id);
  };

  const handleToggleChecklist = async (id: string) => {
    if (!plan) return;
    setPlan((prev) => {
      if (!prev) return null;
      const updated = prev.year_end_checklist.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      );
      return { ...prev, year_end_checklist: updated };
    });
    await toggleChecklistCompleted(id);
  };

  const completedDaysCount = plan?.days.filter((d) => d.completed).length || 0;
  const completedChecklistCount = plan?.year_end_checklist.filter((c) => c.completed).length || 0;
  const totalChecklist = plan?.year_end_checklist.length || 4;
  const checklistPct = Math.round((completedChecklistCount / totalChecklist) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <header className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
            Tactical Execution Board
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Winter Arc Weekly Plan
          </h1>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded hover:bg-accent/90 active:scale-95 transition-transform disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
          <span>{isGenerating ? "Synthesizing..." : "Generate Plan"}</span>
        </button>
      </header>

      {/* PLAN HIGHLIGHTS & VERIFIED PROTOCOL BADGE */}
      {plan && (
        <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {plan.week_title}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-success bg-surface-2 px-2 py-0.5 rounded border border-border">
              <ShieldCheck className="w-3 h-3" />
              Verified Protocol
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {plan.focus_statement}
          </p>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border text-center">
            <div className="bg-surface-2 p-2 rounded border border-border">
              <span className="text-[9px] uppercase text-muted-foreground block">CALORIES</span>
              <span className="text-xs font-bold text-foreground tabular-nums">{plan.calorie_target}</span>
            </div>
            <div className="bg-surface-2 p-2 rounded border border-border">
              <span className="text-[9px] uppercase text-muted-foreground block">PROTEIN</span>
              <span className="text-xs font-bold text-fire tabular-nums">{plan.protein_target_g}g</span>
            </div>
            <div className="bg-surface-2 p-2 rounded border border-border">
              <span className="text-[9px] uppercase text-muted-foreground block">HYDRATION</span>
              <span className="text-xs font-bold text-accent tabular-nums">{plan.water_target_ml}ml</span>
            </div>
            <div className="bg-surface-2 p-2 rounded border border-border">
              <span className="text-[9px] uppercase text-muted-foreground block">BUDGET</span>
              <span className="text-xs font-bold text-foreground tabular-nums">${plan.weekly_budget_limit}</span>
            </div>
          </div>
        </section>
      )}

      {/* 7-DAY INTERACTIVE WEEKLY BOARD */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-accent" />
            <span>7-Day Schedule ({completedDaysCount} / 7 Completed)</span>
          </h2>
        </div>

        <div className="space-y-2.5">
          {plan?.days.map((dayItem, idx) => (
            <div
              key={dayItem.day}
              className={cn(
                "p-3.5 rounded-lg border transition-all space-y-2",
                dayItem.completed
                  ? "bg-surface-2/90 border-success/40"
                  : "bg-surface-1 border-border hover:border-border-active"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-bold tracking-wide uppercase",
                    dayItem.completed ? "text-success line-through" : "text-accent"
                  )}
                >
                  {dayItem.day}
                </span>

                <button
                  onClick={() => handleToggleDay(idx)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors",
                    dayItem.completed
                      ? "bg-success text-black border-success"
                      : "bg-surface-2 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{dayItem.completed ? "Completed" : "Check Off"}</span>
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-fire shrink-0 mt-0.5" />
                  <span className={cn("text-foreground font-medium", dayItem.completed && "line-through text-muted-foreground")}>
                    {dayItem.workout}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Utensils className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-[11px]">
                    {dayItem.meals_focus}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-[11px]">
                    Habit Focus: {dayItem.habit_focus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUPPLEMENT SCHEDULE */}
      {plan && plan.supplements_schedule.length > 0 && (
        <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Daily Supplement Protocol
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {plan.supplements_schedule.map((sup) => (
              <div
                key={sup.id}
                onClick={() => handleToggleSup(sup.id)}
                className={cn(
                  "p-2.5 rounded border text-left cursor-pointer transition-colors flex items-center justify-between",
                  sup.completed
                    ? "bg-surface-2 border-success/40"
                    : "bg-surface-2/40 border-border hover:border-border-active"
                )}
              >
                <div>
                  <span className={cn("text-xs font-semibold block text-foreground", sup.completed && "line-through text-muted-foreground")}>
                    {sup.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {sup.dose} • {sup.timing}
                  </span>
                </div>
                <div
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center border",
                    sup.completed ? "bg-success border-success text-black" : "border-border"
                  )}
                >
                  {sup.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* YEAR-END DISCIPLINE CHECKLIST */}
      {plan && plan.year_end_checklist.length > 0 && (
        <section className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Winter Arc Year-End Checklist
            </h2>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {checklistPct}%
            </span>
          </div>

          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${checklistPct}%` }}
            />
          </div>

          <div className="space-y-2 pt-1">
            {plan.year_end_checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklist(item.id)}
                className="flex items-center gap-2.5 text-xs cursor-pointer select-none group"
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                    item.completed ? "bg-accent border-accent text-accent-foreground" : "border-border bg-surface-2"
                  )}
                >
                  {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={cn("transition-colors", item.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                  {item.task}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
