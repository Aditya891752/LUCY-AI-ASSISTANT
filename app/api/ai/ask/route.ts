import { NextRequest, NextResponse } from "next/server";
import { executeGroundingQueries, GroundedRecord } from "@/lib/ai/tools/grounding";
import { runDoubleVerificationPipeline } from "@/lib/ai/pipeline/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body?.question;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question string is required" }, { status: 400 });
    }

    const trimmedQuestion = question.trim();

    // 1. Retrieve Ground Truth records from user's categories
    const queryResults = await executeGroundingQueries(trimmedQuestion);
    const allRecords: GroundedRecord[] = queryResults.flatMap((r) => r.records);

    // Filter out notes if querying specific metrics and no actual logs exist
    const nonNoteRecords = allRecords.filter((r) => r.category !== "Notes");
    const isPreferenceQuery =
      trimmedQuestion.toLowerCase().includes("rule") ||
      trimmedQuestion.toLowerCase().includes("note") ||
      trimmedQuestion.toLowerCase().includes("preference") ||
      trimmedQuestion.toLowerCase().includes("constraint");

    if (nonNoteRecords.length === 0 && !isPreferenceQuery) {
      return NextResponse.json({
        success: true,
        answer: "I searched your ground-truth records, but found no logged data matching this question. Nothing has been logged yet.",
        sources: [],
        has_records: false,
        is_verified: true,
      });
    }

    // 2. Execute Complete 7-Stage Double Verification Pipeline
    const pipelineResult = await runDoubleVerificationPipeline(trimmedQuestion, allRecords);

    return NextResponse.json({
      success: true,
      answer: pipelineResult.final_answer,
      sources: pipelineResult.cited_records,
      has_records: true,
      is_verified: pipelineResult.is_verified,
      support_rate: pipelineResult.support_rate,
      claims_audit: pipelineResult.claims_audit,
    });
  } catch (error) {
    console.error("QA Double Verification Pipeline error:", error);
    return NextResponse.json(
      { error: "Failed to verify query against ground-truth database." },
      { status: 500 }
    );
  }
}
