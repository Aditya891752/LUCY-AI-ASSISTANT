"use server";

import { createClient } from "@/lib/db/supabase-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface UserNote {
  id: string;
  category: string;
  text: string;
  pinned: boolean;
  created_at: string;
}

const DEFAULT_NOTES: UserNote[] = [
  {
    id: "note-1",
    category: "Nutrition",
    text: "I do not eat any solid food after 9:00 PM (Intermittent Fasting).",
    pinned: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "note-2",
    category: "Training",
    text: "Focusing on progressive overload on compound lifts this Winter Arc.",
    pinned: true,
    created_at: new Date().toISOString(),
  },
];

export async function getNotes(): Promise<UserNote[]> {
  const cookieStore = await cookies();
  const cachedRaw = cookieStore.get("lucy_notes")?.value;
  let notes: UserNote[] = cachedRaw ? JSON.parse(cachedRaw) : DEFAULT_NOTES;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: dbNotes } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false });

    if (dbNotes && dbNotes.length > 0) {
      notes = dbNotes;
    }
  }

  return notes;
}

export async function saveNote(text: string, category: string = "General") {
  const cookieStore = await cookies();
  const notes = await getNotes();

  const newNote: UserNote = {
    id: `note-${Date.now()}`,
    category,
    text: text.trim(),
    pinned: true,
    created_at: new Date().toISOString(),
  };

  const updated = [newNote, ...notes];
  cookieStore.set("lucy_notes", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("notes").insert({
      user_id: user.id,
      category,
      text: newNote.text,
      pinned: true,
    });
  }

  revalidatePath("/ask");
  return { success: true, note: newNote };
}

export async function deleteNote(id: string) {
  const cookieStore = await cookies();
  const notes = await getNotes();
  const updated = notes.filter((n) => n.id !== id);
  cookieStore.set("lucy_notes", JSON.stringify(updated), { path: "/" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("notes").delete().eq("id", id);
  }

  revalidatePath("/ask");
  return { success: true };
}
