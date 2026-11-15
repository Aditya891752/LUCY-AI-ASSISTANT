import { NextRequest, NextResponse } from "next/server";
import { parseCommandInput } from "@/lib/ai/intent";
import { createClient } from "@/lib/db/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body?.input;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input string is required" }, { status: 400 });
    }

    // Optional Supabase session check for live mode
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const parsed = await parseCommandInput(input);
    return NextResponse.json({ success: true, result: parsed, user_id: user?.id || null });
  } catch (error) {
    console.error("Command parsing error:", error);
    // Sanitize error response: zero stack traces to user
    return NextResponse.json(
      { error: "Could not parse command. Please check your input." },
      { status: 500 }
    );
  }
}
