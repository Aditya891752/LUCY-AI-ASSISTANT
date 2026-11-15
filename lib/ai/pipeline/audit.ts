import { createClient } from "@/lib/db/supabase-server";
import { cookies } from "next/headers";

export interface AuditEntry {
  question: string;
  draft_answer: Record<string, unknown>;
  verification_result: Record<string, unknown>;
  final_answer: Record<string, unknown>;
  timestamp?: string;
}

export async function logAIAudit(entry: AuditEntry): Promise<void> {
  const timestamp = new Date().toISOString();

  try {
    const cookieStore = await cookies();
    const cachedAuditsRaw = cookieStore.get("lucy_ai_audits")?.value;
    const existing = cachedAuditsRaw ? JSON.parse(cachedAuditsRaw) : [];

    const newAudit = { ...entry, timestamp };
    cookieStore.set("lucy_ai_audits", JSON.stringify([newAudit, ...existing.slice(0, 20)]), {
      path: "/",
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("ai_audit").insert({
        user_id: user.id,
        question: entry.question,
        draft_answer: entry.draft_answer,
        verification_result: entry.verification_result,
        final_answer: entry.final_answer,
      });
    }
  } catch (err) {
    console.warn("Failed to write to ai_audit table:", err);
  }
}
