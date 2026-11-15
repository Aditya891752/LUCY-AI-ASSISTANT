"use server";

import { createClient } from "@/lib/db/supabase-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface EventRecord {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  display_time?: string;
  people: string[];
  location?: string | null;
  notes?: string | null;
  remind_offsets: number[];
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

const DEFAULT_EVENTS: EventRecord[] = [
  {
    id: "evt-1",
    title: "Meeting with Rahul",
    starts_at: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(), // 3 hours from now
    display_time: "Today, 5:00 PM",
    people: ["Rahul"],
    location: "Google Meet",
    remind_offsets: [30, 0],
    status: "scheduled",
    created_at: new Date().toISOString(),
  },
];

export async function getEvents(): Promise<EventRecord[]> {
  const cookieStore = await cookies();
  const cachedRaw = cookieStore.get("lucy_events")?.value;
  let events: EventRecord[] = cachedRaw ? JSON.parse(cachedRaw) : DEFAULT_EVENTS;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: dbEvents } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true });

    if (dbEvents && dbEvents.length > 0) {
      events = dbEvents;
    }
  }

  return events;
}

export async function createEvent(input: {
  title: string;
  starts_at: string;
  ends_at?: string;
  display_time?: string;
  people?: string[];
  location?: string;
  notes?: string;
  remind_offsets?: number[];
}) {
  const cookieStore = await cookies();
  const events = await getEvents();

  const newEvent: EventRecord = {
    id: `evt-${Date.now()}`,
    title: input.title,
    starts_at: input.starts_at,
    ends_at: input.ends_at || null,
    display_time: input.display_time,
    people: input.people || [],
    location: input.location || null,
    notes: input.notes || null,
    remind_offsets: input.remind_offsets || [30, 0],
    status: "scheduled",
    created_at: new Date().toISOString(),
  };

  const updated = [...events, newEvent];
  cookieStore.set("lucy_events", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("events").insert({
      user_id: user.id,
      title: input.title,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      people: input.people || [],
      location: input.location,
      notes: input.notes,
      remind_offsets: input.remind_offsets || [30, 0],
      status: "scheduled",
    });
  }

  revalidatePath("/today");
  return { success: true, event: newEvent };
}

export async function dismissEvent(eventId: string) {
  const cookieStore = await cookies();
  const events = await getEvents();
  const updated = events.filter((e) => e.id !== eventId);
  cookieStore.set("lucy_events", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("events").update({ status: "completed" }).eq("id", eventId);
  }

  revalidatePath("/today");
  return { success: true };
}
