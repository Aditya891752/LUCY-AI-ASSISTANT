# System Architecture - Lucy (Personal Life Assistant)

## 1. High-Level Architecture Overview

Lucy is architected as a secure, full-stack application built around a zero-trust model between client and external AI services. The user's device communicates exclusively with Next.js Server Routes / Server Actions, which handle database access via Supabase PostgreSQL (enforced with Row Level Security) and invoke Google Gemini AI through server-only SDK credentials.

```
+-------------------------------------------------------------------------------+
|                                  CLIENT TIER                                  |
|  +-------------------------------------------------------------------------+  |
|  |  Next.js App Router (React 19 / Client Components)                      |  |
|  |  - TanStack Query (Server State Cache & Optimistic Mutations)           |  |
|  |  - Web Speech API (Voice Capture -> Fallback to Typed Input)             |  |
|  |  - Serwist Service Worker (PWA Shell & Push Notification Handlers)      |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
                                       |
                       HTTPS (Cookie / Bearer JWT)
                                       v
+-------------------------------------------------------------------------------+
|                           APPLICATION SERVER TIER                             |
|  Next.js App Router (Node.js / Edge Runtime)                                  |
|                                                                               |
|  +------------------------+  +-----------------------+  +------------------+  |
|  | Middleware / Auth Gate |  | Rate Limiter / Safety |  | Zod Validator    |  |
|  | (Supabase Session SSR) |  | (Upstash / Token)     |  | (Shared Schemas) |  |
|  +------------------------+  +-----------------------+  +------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | /lib/ai - Dual Verification AI Pipeline                                  |  |
|  |  - Drafter: Function calling with query tools (Exact DB Read)           |  |
|  |  - Verifier: Claims verification against cited rows                     |  |
|  |  - Deterministic Math Engine: Code-computed totals & macro validation   |  |
|  |  - Safety Check: Range checks & medical disclaimers                     |  |
|  +-------------------------------------------------------------------------+  |
|  | /lib/db - Supabase Service Layer (Scoped by Auth Context)               |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
                       |                                       |
           PostgreSQL Connection (RLS)              HTTPS / TLS (Server Only)
                       v                                       v
+------------------------------------------+  +---------------------------------+
|            DATABASE TIER                 |  |            AI TIER              |
|  Supabase Managed PostgreSQL             |  |  Google Gemini API              |
|  - Auth Schema (Users & JWTs)            |  |  (@google/genai SDK)            |
|  - Public Tables with RLS                |  |  - Intent Classifier / Parser   |
|  - Database Indexes on (user_id, date)   |  |  - Q&A Drafter & Verifier       |
|  - pg_cron / Edge Workers (Push Delivery)|  |  - Winter Arc Planner           |
+------------------------------------------+  +---------------------------------+
```

---

## 2. Structural Layer Separation

### 2.1 Presentation Layer (Client)
- **Framework:** Next.js App Router (`/app`), React 19.
- **State Management:**
  - Server state: TanStack Query (React Query v5) with stale-while-revalidate and aggressive cache invalidation keys (`['meals', date]`, `['events', week]`).
  - Form state: React Hook Form coupled with client-side Zod validation mirrors.
  - UI State: Lightweight React Context for modal and command bar toggling.
- **Micro-Interactions & Transitions:** Framer Motion powering directional screen slides, tab indicators, and progress ring animations.
- **PWA & Voice:**
  - Serwist managing service-worker registration and push events.
  - Native browser `webkitSpeechRecognition` / `SpeechRecognition` for audio command parsing with instant fallback to standard text entry.

### 2.2 Security & Gateway Layer (Server Middleware)
- **Session Verification:** `middleware.ts` runs on all routes except static assets (`_next`, favicon, manifest). It verifies the Supabase auth token and redirects unauthenticated requests away from `/dashboard`, `/track`, `/ask`, `/plan`, and `/money`.
- **Rate Limiting:** API endpoints (`/api/command`, `/api/ai/*`) validate token buckets based on `user_id` to block request abuse and runaway API consumption.
- **Error Shielding:** Centralized API handler catches all unhandled exceptions, sanitizes technical traces, logs to server-only monitoring, and responds with a safe, human-readable error payload.

### 2.3 Business Logic & AI Orchestration Layer (`/lib/ai`)
- Isolated from both UI components and client bundles.
- Contains the **Double Verification Pipeline**:
  1. **Intent Resolver:** Converts raw user prompts into targeted action intents or search parameters.
  2. **DB Query Execution:** Executes queries within the active user's RLS context, returning immutable record arrays.
  3. **Draft Engine:** Calls Gemini with structured output schemas requiring every single fact to cite `record_id`s.
  4. **Verification Engine:** Dispatches a separate, low-temperature Gemini call with isolated claims and citation records.
  5. **Deterministic Code Aggregator:** Computes math (calorie sums, budget differences, streak counts) strictly in TypeScript to prevent arithmetic hallucinations.
  6. **Safety Rules Layer:** Flags out-of-range clinical vitals and appends medical disclaimers.
  7. **Audit Log:** Commits the full trace (`question`, `draft_answer`, `verification_result`, `final_answer`) into `ai_audit`.

### 2.4 Data Persistence Layer (`/lib/db`)
- PostgreSQL hosted on Supabase.
- **Row Level Security (RLS) Mandate:** 
  - Every single application table enforces `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
  - Policies enforce `auth.uid() = user_id` for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
  - The client interacts with Supabase using the public Anon key + authenticated user JWT.
  - Service Role Key is strictly confined to server-side background cron jobs and never loaded in client bundles.

---

## 3. Data Flow Lifecycles

### 3.1 Meal & Habit Quick-Log Flow
```
User speaks/types -> Command Bar 
  -> Server Route /api/command 
  -> Gemini Intent & Parameter Extraction (JSON)
  -> Returns Structured Draft to Client
  -> Client displays Confirmation Card
  -> User clicks "Confirm" (or edits values)
  -> Supabase INSERT with user_id
  -> React Query Cache Invalidated -> UI Rings update optimistically
```

### 3.2 Ask-Your-Data Q&A Lifecycle
```
User Question ("What did I eat on Wednesday?")
  -> POST /api/ai/ask
  -> Gemini function calling selects query_meals(2026-11-11, 2026-11-11)
  -> Server queries Supabase `meals` for user_id
  -> Retrieved DB rows passed to Gemini Drafter
  -> Drafter produces structured JSON claims with cited row IDs
  -> Server dispatches Verifier call (low temp)
  -> Verifier returns { claim_id, verdict: "supported" | "partially_supported" | "unsupported" }
  -> Server filters unsupported claims; code calculates total calories
  -> Result logged to `ai_audit` table
  -> Verified answer + expandable sources returned to Client
```

---

## 4. Key Performance & Resilience Patterns
- **Optimistic UI:** When a user checks off a habit or logs water, the UI updates instantly while the mutation executes in the background. On failure, state rolls back with a toast alert.
- **Fail-Safe Fallbacks:** When offline or when the Gemini API returns a 5xx/rate-limit error, the app displays raw database logs without AI summarization rather than crashing or showing a blank screen.
- **Strict Data Isolation:** Multi-tenancy is enforced at the database kernel via PostgreSQL RLS policies, making cross-user data leakage architecturally impossible.
