# Project Memory & Context - Lucy

## 1. Project Essence & Core Context
- **Name:** Lucy
- **Purpose:** Personal Life Assistant that operates strictly on the user's persisted data rather than general LLM speculation.
- **Theme:** "Winter Arc" — an aesthetic and psychological anchor emphasizing personal discipline, workouts, nutrition adherence, savings, and routine execution.
- **Core Problem Solved:** Eliminates LLM amnesia and hallucinations by combining structured PostgreSQL data tracking with an automated **Double Verification Pipeline**.
- **Model of Record:** Single-user per account, mobile-first web app (PWA), deployed on Vercel with a Supabase PostgreSQL backend.

---

## 2. Inviolable Architectural Decisions
1. **Database as Ground Truth:** The model has no personal memory of the user other than what is queried from Supabase tables via function tools.
2. **Server-Side AI Exclusivity:** All Gemini API interactions happen inside `/lib/ai/` executed exclusively on Node.js / Edge server routes. No keys or direct calls from browser scripts.
3. **Double Verification Contract:**
   - Call 1 (Drafter): Generates structured claims with cited record IDs.
   - Call 2 (Verifier): Skeptical, low-temperature audit of claims against cited database records only.
   - Deterministic Math: Calorie arithmetic, macro sums, and budget math are calculated in TypeScript, overriding any model guesses.
   - Safety Rules: Vitals outside medical reference ranges trigger gentle medical disclaimers; no diagnoses permitted.
4. **Row Level Security (RLS) on 100% of Tables:** Every table (`profiles`, `events`, `meals`, `health_logs`, `workouts`, `supplements`, `supplement_logs`, `habits`, `habit_logs`, `transactions`, `budgets`, `goals_money`, `notes`, `plans`, `push_subscriptions`, `ai_audit`) must have RLS active enforcing `auth.uid() = user_id`.

---

## 3. Design Language & Negative Constraints Registry
- **Aesthetic:** Dark tactical midnight (`#090A0F`), solid matte slate surfaces (`#11131A`), 1px crisp borders (`#232734`), high-contrast typography (`#F3F4F6`), ice steel accents (`#38BDF8`), habit fire amber (`#F59E0B`).
- **Strictly Banned Patterns:**
  - No purple-to-blue gradients or gradient hero text.
  - No emojis in headings.
  - No generic Inter font everywhere (use Geist / Plus Jakarta Sans).
  - No colored-border or glassmorphic cards.
  - No 3-icon feature boxes in a row.
  - No floating badges over headlines.
  - No decorative Lucide icon spam.
  - No untouched default shadcn/ui.
  - No fade-in on scroll or cursor-following beams.
  - No button opacity fade transitions on hover (use tactile scale/border shifts).
  - No inconsistent spacing (strictly 4px/8px modular rhythm).
  - No em dashes scattered across copy.
  - No Space Grotesk + Instrument Serif combinations or serif italic accents.
  - No grain over gradients.

---

## 4. Key Security Directives (Three Highest-Risk Rules)
1. **Rule 1 (Highest Risk):** Overly permissive DB rules (RLS off or world-readable). Prevented by automated migration audits.
2. **Rule 2 (Second Risk):** API keys or secrets in frontend or committed to git. Prevented by server-only environment variable isolation.
3. **Rule 3 (Third Risk):** Auth checks that only exist client-side. Prevented by server-side session checks in middleware and API routes.

---

## 5. Development Timeline & Progression Log
- **2026-11-15 (Initial Inception):**
  - Project specification provided in `Personal Life Assistant Project Spec.pdf`.
  - Extracted to [PROJECT_SPEC.md](file:///d:/LUCY-AI-ASSISTANT/PROJECT_SPEC.md).
  - Created master governance and progression documentation:
    - [prd.md](file:///d:/LUCY-AI-ASSISTANT/prd.md) (Product Requirements Document)
    - [architecture.md](file:///d:/LUCY-AI-ASSISTANT/architecture.md) (Technical Architecture & Layer Breakdown)
    - [techstack.md](file:///d:/LUCY-AI-ASSISTANT/techstack.md) (Libraries, Versions & Rationale)
    - [aistack.md](file:///d:/LUCY-AI-ASSISTANT/aistack.md) (AI Integration, Schemas & Double Verification)
    - [rules.md](file:///d:/LUCY-AI-ASSISTANT/rules.md) (Strict Anti-Patterns & Security Rules)
    - [design.md](file:///d:/LUCY-AI-ASSISTANT/design.md) (Design Tokens & UI System)
    - [task.md](file:///d:/LUCY-AI-ASSISTANT/task.md) (GSD Work Breakdown & Verification Gates)
    - [memory.md](file:///d:/LUCY-AI-ASSISTANT/memory.md) (Context & Project Memory)
    - [architecture-diagram.md](file:///d:/LUCY-AI-ASSISTANT/architecture-diagram.md) (Separation & Deployment Guide for Backend and Frontend)
