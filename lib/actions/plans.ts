"use server";

import { createClient } from "@/lib/db/supabase-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateWeeklyPlan, WeeklyPlan } from "@/lib/ai/planner";

export async function getActivePlan(): Promise<WeeklyPlan> {
  const cookieStore = await cookies();
  const cachedRaw = cookieStore.get("lucy_active_plan")?.value;

  if (cachedRaw) {
    try {
      return JSON.parse(cachedRaw);
    } catch {
      // Fall through to generate
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: dbPlan } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (dbPlan && dbPlan.content) {
      return dbPlan.content as unknown as WeeklyPlan;
    }
  }

  // Generate initial plan if none exists
  return generateAndSavePlan();
}

export async function generateAndSavePlan(): Promise<WeeklyPlan> {
  const cookieStore = await cookies();
  const plan = await generateWeeklyPlan();

  cookieStore.set("lucy_active_plan", JSON.stringify(plan), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const weekStart = new Date().toISOString().split("T")[0];
    await supabase.from("plans").insert({
      user_id: user.id,
      week_start: weekStart,
      content: plan,
      status: "active",
      verification_report: plan.verification_report,
    });
  }

  revalidatePath("/plan");
  revalidatePath("/today");
  return plan;
}

export async function toggleDayCompleted(dayIndex: number): Promise<WeeklyPlan> {
  const cookieStore = await cookies();
  const plan = await getActivePlan();

  if (plan.days[dayIndex]) {
    plan.days[dayIndex].completed = !plan.days[dayIndex].completed;
  }

  cookieStore.set("lucy_active_plan", JSON.stringify(plan), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("plans")
      .update({ content: plan })
      .eq("user_id", user.id)
      .eq("status", "active");
  }

  revalidatePath("/plan");
  return plan;
}

export async function toggleSupplementCompleted(supId: string): Promise<WeeklyPlan> {
  const cookieStore = await cookies();
  const plan = await getActivePlan();

  plan.supplements_schedule = plan.supplements_schedule.map((s) =>
    s.id === supId ? { ...s, completed: !s.completed } : s
  );

  cookieStore.set("lucy_active_plan", JSON.stringify(plan), { path: "/" });
  revalidatePath("/plan");
  return plan;
}

export async function toggleChecklistCompleted(chkId: string): Promise<WeeklyPlan> {
  const cookieStore = await cookies();
  const plan = await getActivePlan();

  plan.year_end_checklist = plan.year_end_checklist.map((c) =>
    c.id === chkId ? { ...c, completed: !c.completed } : c
  );

  cookieStore.set("lucy_active_plan", JSON.stringify(plan), { path: "/" });
  revalidatePath("/plan");
  return plan;
}
