export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type CalcBaseline = "Male" | "Female" | "Average";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type Goal = "fat loss" | "muscle gain" | "maintenance" | "discipline" | "savings";
export type DietPreference = "veg" | "non-veg" | "vegan" | "eggetarian";

export interface Profile {
  id: string;
  user_id: string;
  gender: Gender;
  calc_baseline: CalcBaseline;
  dob?: string | null;
  age?: number | null;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goals: Goal[];
  diet_pref: DietPreference;
  allergies: string[];
  wake_time: string;
  sleep_time: string;
  timezone: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  user_id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  people: string[];
  location?: string | null;
  notes?: string | null;
  remind_offsets: number[];
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  eaten_at: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  user_edited: boolean;
  created_at: string;
}

export type HealthMetric =
  | "weight"
  | "water_ml"
  | "sleep_h"
  | "steps"
  | "mood"
  | "bp_sys"
  | "bp_dia"
  | "glucose";

export interface HealthLog {
  id: string;
  user_id: string;
  logged_at: string;
  metric: HealthMetric;
  value: number;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  performed_at: string;
  exercise: string;
  sets: number;
  reps: number;
  weight_kg: number;
  duration_min: number;
  created_at: string;
}

export interface Supplement {
  id: string;
  user_id: string;
  name: string;
  dose: string;
  schedule: string;
  active: boolean;
  created_at: string;
}

export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  taken_at: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  target_per_week: number;
  points: number;
  streak: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  done_on: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  occurred_on: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  note?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string;
  category: string;
  limit_amount: number;
  created_at: string;
}

export interface GoalMoney {
  id: string;
  user_id: string;
  name: string;
  target: number;
  deadline?: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  category: string;
  text: string;
  pinned: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  week_start: string;
  content: Record<string, unknown>;
  status: "active" | "archived";
  verification_report: Record<string, unknown>;
  created_at: string;
}

export interface AIAudit {
  id: string;
  user_id: string;
  question: string;
  draft_answer: Record<string, unknown>;
  verification_result: Record<string, unknown>;
  final_answer: Record<string, unknown>;
  created_at: string;
}
