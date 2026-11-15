import { NextRequest, NextResponse } from "next/server";
import { executeGroundingQueries, GroundedRecord } from "@/lib/ai/tools/grounding";
import { getGeminiClient, getGeminiModelName } from "@/lib/ai/client";
import { createClient } from "@/lib/db/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body?.question;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question string is required" }, { status: 400 });
    }

    const trimmedQuestion = question.trim();

    // 1. Retrieve Ground Truth from user's categories
    const queryResults = await executeGroundingQueries(trimmedQuestion);
    const allRecords: GroundedRecord[] = queryResults.flatMap((r) => r.records);

    // If no records found outside notes
    const nonNoteRecords = allRecords.filter((r) => r.category !== "Notes");
    if (nonNoteRecords.length === 0 && !trimmedQuestion.toLowerCase().includes("rule") && !trimmedQuestion.toLowerCase().includes("note") && !trimmedQuestion.toLowerCase().includes("preference")) {
      return NextResponse.json({
        success: true,
        answer: "I searched your ground-truth records, but found no logged data matching this question. Nothing has been logged yet.",
        sources: [],
        has_records: false,
      });
    }

    // 2. Synthesize Grounded Answer with Gemini
    const ai = getGeminiClient();
    if (ai) {
      try {
        const model = getGeminiModelName();
        const recordsContext = allRecords
          .map((r) => `[Record ID: ${r.id} | Category: ${r.category}] ${r.description}`)
          .join("\n");

        const prompt = `You are Lucy, an uncompromising, disciplined Winter Arc personal assistant.
CRITICAL MANDATE:
Answer the user's question using ONLY the provided database records below.
Do not guess, assume, or extrapolate.
If a detail is not explicitly stated in the records, say "not found in your records".
Cite the exact Record IDs that support your answer.

User Question: "${trimmedQuestion}"

GROUND-TRUTH RECORDS:
${recordsContext}

Respond in concise, factual prose. Do not use generic filler words.`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const answerText = response.text || "No records found.";
        return NextResponse.json({
          success: true,
          answer: answerText,
          sources: allRecords,
          has_records: true,
        });
      } catch (err) {
        console.warn("Gemini QA call failed, falling back to deterministic synthesizer:", err);
      }
    }

    // Deterministic Offline Ground-Truth Synthesizer
    const summarySentences = nonNoteRecords.slice(0, 4).map((r) => r.description);
    const notePreferences = allRecords.filter((r) => r.category === "Notes").map((n) => n.description);

    let answer = `Based on your records:\n• ${summarySentences.join("\n• ")}`;
    if (notePreferences.length > 0) {
      answer += `\n\nActive Personal Constraints:\n• ${notePreferences.join("\n• ")}`;
    }

    return NextResponse.json({
      success: true,
      answer,
      sources: allRecords,
      has_records: true,
    });
  } catch (error) {
    console.error("QA error:", error);
    return NextResponse.json(
      { error: "Failed to query personal database." },
      { status: 500 }
    );
  }
}
