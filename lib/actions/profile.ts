"use server";

import { ProfileFormSchema, ProfileFormData } from "@/lib/validations/profile";
import { createClient } from "@/lib/db/supabase-server";
import { calculateTargets } from "@/lib/calc/targets";
import { cookies } from "next/headers";

export interface SaveProfileResponse {
  success: boolean;
  error?: string;
  targets?: ReturnType<typeof calculateTargets>;
}

export async function saveProfile(rawData: ProfileFormData): Promise<SaveProfileResponse> {
  const parseResult = ProfileFormSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const data = parseResult.data;
  const targets = calculateTargets({
    calc_baseline: data.calc_baseline,
    weight_kg: data.weight_kg,
    height_cm: data.height_cm,
    age: data.age,
    activity_level: data.activity_level,
    goals: data.goals,
  });

  const cookieStore = await cookies();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error: dbError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      gender: data.gender,
      calc_baseline: data.calc_baseline,
      age: data.age,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      activity_level: data.activity_level,
      goals: data.goals,
      diet_pref: data.diet_pref,
      allergies: data.allergies,
      wake_time: data.wake_time,
      sleep_time: data.sleep_time,
      timezone: data.timezone,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      return { success: false, error: dbError.message };
    }
  }

  // Set session cookie for local profile persistence & fast SSR gating
  cookieStore.set("lucy_onboarding_complete", "true", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  cookieStore.set("lucy_profile_cache", JSON.stringify({ ...data, targets }), {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return {
    success: true,
    targets,
  };
}

export async function getProfile() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) return profile;
  }

  // Fallback to cookie cache
  const cached = cookieStore.get("lucy_profile_cache")?.value;
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  return null;
}
