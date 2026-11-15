# AI Stack & Verification Pipeline - Lucy

## 1. AI Architecture Philosophy
Lucy treats Artificial Intelligence as an **untrusted, creative parser and reasoning layer** rather than a factual source of truth. The database is the ground truth.
All AI operations are strictly:
1. **Server-Side Only:** No client-side API keys or direct LLM calls from the browser.
2. **Structured Outputs Only:** All calls enforce strict JSON schemas verified by `zod`.
3. **Double-Verified:** Every AI-synthesized claim is independently audited by a verifier model against database records before display.
4. **Code-Calculated Math:** All arithmetic, calorie balances, macro percentages, and budget comparisons are calculated deterministically in TypeScript.

---

## 2. Gemini Integration Layer (`/lib/ai`)

```
/lib/ai/
  ├── client.ts             # Google Gen AI SDK singleton initialization
  ├── intent.ts             # Command bar classifier (meal, event, health, Q&A)
  ├── meals.ts              # Natural language meal macro estimation
  ├── events.ts             # Natural language meeting/reminder parser
  ├── tools/                # Grounding function definitions for Q&A
  │   ├── query-meals.ts
  │   ├── query-events.ts
  │   ├── query-health.ts
  │   ├── query-money.ts
  │   └── query-notes.ts
  ├── pipeline/             # Double Verification Engine
  │   ├── drafter.ts        # Generates structured claims with citation record IDs
  │   ├── verifier.ts       # Independent verification pass (low temp)
  │   ├── resolver.ts       # Filters unverifiable claims; inserts "not in records"
  │   ├── math-check.ts     # TypeScript deterministic calculation validator
  │   └── safety-rules.ts   # Medical bounds checking & disclaimer insertion
  ├── planner.ts            # Winter Arc weekly plan generator
  └── schemas.ts            # Shared Zod schemas for all model I/O
```

---

## 3. The 7-Stage Double Verification Pipeline

```
  +-------------------------------------------------------------+
  | Stage 1: RETRIEVAL & GROUNDING                               |
  | - Gemini receives question + function declarations          |
  | - Calls query tools (e.g., query_meals(2026-11-10, ...))    |
  | - Server executes SQL scoped by active user_id              |
  | - Exact DB records returned to prompt context               |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | Stage 2: STRUCTURED DRAFTING                                |
  | - Temperature: 0.2                                          |
  | - Output: Array of atomic claims                            |
  | - Schema: { claims: [{ text: string, cited_ids: string[] }] }|
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | Stage 3: INDEPENDENT VERIFIER PASS                          |
  | - Fresh context, Temperature: 0.0                           |
  | - Receives ONLY the claims and the exact cited DB rows      |
  | - Verdict per claim:                                        |
  |   "supported" | "partially_supported" | "unsupported"       |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | Stage 4: RESOLUTION & FILTERING                             |
  | - Supported claims preserved                                |
  | - Partially supported claims rewritten or flagged           |
  | - Unsupported claims converted to "not in your records"     |
  | - Threshold: If > 50% claims fail, return safe fallback     |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | Stage 5: DETERMINISTIC CODE MATH CHECK                      |
  | - Code recalculates calorie sums, macro grams, and expenses |
  | - Overrides any arithmetic discrepancies made by model      |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | Stage 6: HEALTH & SAFETY RULES CHECK                        |
  | - Calorie floors enforced (minimum 1200 kcal/day safety)    |
  | - Vital bounds checked (e.g., BP > 140/90 flags caution)    |
  | - Disclaimers appended; diagnostic statements banned        |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | Stage 7: AUDIT LOGGING                                      |
  | - Writes question, draft, verification result, and final    |
  |   output to `ai_audit` table for full observability         |
  +-------------------------------------------------------------+
```

---

## 4. Model Prompts & Schemas

### 4.1 Intent & Parameter Parser Schema (Zod)
```typescript
import { z } from "zod";

export const CommandIntentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("meal"),
    description: z.string(),
    estimated_calories: z.number().int().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
  }),
  z.object({
    type: z.literal("event"),
    title: z.string(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime().optional(),
    location: z.string().optional(),
    people: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal("health"),
    metric: z.enum(["weight", "water_ml", "sleep_h", "steps", "mood", "bp_sys", "bp_dia", "glucose"]),
    value: z.number(),
  }),
  z.object({
    type: z.literal("question"),
    query: z.string(),
  }),
]);
```

### 4.2 Verifier Prompt Contract
```text
You are a strict, skeptical facts auditor.
Evaluate each claim against the provided database records ONLY.
Do not assume, extrapolate, or use outside world knowledge about the user.
For each claim, output one of:
- "supported": The provided records explicitly prove this claim.
- "partially_supported": The record matches partially but some detail is unverified.
- "unsupported": The record does not support this claim or no record was cited.

Return strictly JSON matching the required schema.
```

---

## 5. Resilience & Rate-Limiting Policy
- **Model Fallback:** Configured through `GEMINI_MODEL`. Defaults to `gemini-2.5-flash` (or current active flash tier).
- **Retry Strategy:** On JSON schema parse failure, single automated retry with corrected schema instructions; on second failure, returns graceful non-AI error response.
- **Budget & Quota Protection:** Per-user daily call caps on intensive generative tasks (`/api/ai/plan` capped to 3 requests per hour; `/api/ai/ask` capped to 30 requests per hour).
