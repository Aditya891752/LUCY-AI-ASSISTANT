import { z } from "zod";

export const ProfileFormSchema = z.object({
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
  calc_baseline: z.enum(["Male", "Female", "Average"]),
  age: z.coerce.number().int().min(14, "Minimum age is 14").max(100, "Maximum age is 100"),
  height_cm: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Height must be under 250cm"),
  weight_kg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be under 300kg"),
  activity_level: z.enum(["sedentary", "light", "moderate", "very_active", "extra_active"]),
  goals: z.array(z.enum(["fat loss", "muscle gain", "maintenance", "discipline", "savings"])).min(1, "Select at least one goal"),
  diet_pref: z.enum(["veg", "non-veg", "vegan", "eggetarian"]),
  allergies: z.array(z.string()).default([]),
  wake_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  sleep_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  timezone: z.string().min(1, "Timezone is required"),
});

export type ProfileFormData = z.infer<typeof ProfileFormSchema>;
