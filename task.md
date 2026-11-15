# GSD Execution Roadmap & Task Board - Lucy

This document tracks all implementation phases using the **Get Stuff Done (GSD)** methodology. Each phase contains atomic, verifiable tasks with strict acceptance criteria and regression boundaries.

---

## Phase Status Summary
| Phase | Name | Status | Target Deliverable |
|---|---|---|---|
| **Phase 0** | Project Setup & Shell | [x] Completed | Next.js 15, Tailwind, Supabase Auth SSR, Base Shell, PWA |
| **Phase 1** | Onboarding & Profile Gate | [x] Completed | Hard-gated profile flow, Mifflin-St Jeor calculation engine |
| **Phase 2** | Daily Trackers & Today Screen | [x] Completed | Meals (Gemini estimation), Health vitals, Workouts, Habits |
| **Phase 3** | Reminders & Voice Input | [x] Completed | Event NLP parser, confirmation card, Web Speech, Push notifications |
| **Phase 4** | Personal Finance | [x] Completed | Income/expenses, monthly budgets, savings goals, runway |
| **Phase 5** | Ask-Your-Data Q&A Engine | [x] Completed | Grounded function calling, multi-category query tools |
| **Phase 6** | Double Verification Pipeline | [x] Completed | Drafter + Verifier pass, deterministic math check, audit log |
| **Phase 7** | Winter Arc Weekly Planner | [ ] Pending | Holistic weekly planner, interactive check-off board |
| **Phase 8** | Polish, Hardening & Deployment | [ ] Pending | A11y, animations, security audit, Vercel deployment |

---

## Detailed Phase Breakdown

### Phase 0: Project Setup & Shell
**Goal:** Establish clean Next.js 15 App Router architecture, Supabase SSR client, strict TypeScript configuration, dark Winter Arc design tokens, and PWA scaffolding.
- [x] Initialize Next.js 15 with TypeScript (strict mode) and Tailwind CSS.
- [x] Configure `tsconfig.json` (`strict: true`, `noImplicitAny: true`, alias `@/*`).
- [x] Establish Tailwind theme tokens matching `design.md` (midnight `#090A0F`, slate `#11131A`, ice steel `#38BDF8`).
- [x] Set up Supabase SSR clients (`@supabase/ssr`) for browser, server components, and route handlers.
- [x] Create PostgreSQL migration schema in `/supabase/migrations/` for all tables with RLS enabled.
- [x] Implement `middleware.ts` for session gatekeeper and route protection.
- [x] Build global application shell: Mobile bottom navigation dock (Today, Track, Ask, Plan, Money) and responsive desktop layout.
- [x] Setup `@serwist/next` PWA manifest, service worker shell, and app icons.
- [x] Configure Vitest test runner for unit tests.
- **Verification Criteria:**
  - `npm run build` passes with zero type errors and zero warnings. (Verified - 10/10 static pages compiled)
  - Supabase client connects securely; unauthenticated requests to protected routes redirect. (Verified)
  - Bottom navigation routes cleanly across all empty views. (Verified)

---

### Phase 1: Onboarding & Profile Gate
**Goal:** Deliver an impenetrable onboarding gate that collects biometric demographics, calculates Mifflin-St Jeor targets, and locks the application until completed.
- [x] Implement profile database schema (`profiles` table) with RLS.
- [x] Build multi-step onboarding wizard with React Hook Form and Zod validation:
  - Step 1: Gender selection with "Calculation Baseline" prompt for Other/Prefer not to say.
  - Step 2: Age, Height (cm), Weight (kg), Activity Level.
  - Step 3: Goals selection (fat loss, muscle gain, maintenance, discipline, savings).
  - Step 4: Diet preference (veg/non-veg/vegan/eggetarian) and allergies.
  - Step 5: Wake time, sleep time, and timezone.
- [x] Create `/lib/calc/targets.ts` containing deterministic Mifflin-St Jeor BMR/TDEE math, protein grams calculation, and water intake formula ($ml$).
- [x] Add unit tests in `tests/targets.test.ts` verifying calculation accuracy against known benchmark figures.
- [x] Implement server action to persist profile and flip `onboarding_complete: true`.
- [x] Add middleware and layout gate: Redirect any user with `onboarding_complete == false` directly to `/onboarding`.
- **Verification Criteria:**
  - New user cannot navigate to any dashboard screen until onboarding is submitted. (Verified by middleware)
  - Target calories and protein accurately reflect formula parameters. (Verified by Vitest test suite)

---

### Phase 2: Daily Trackers & Today Screen
**Goal:** Build the core tracking interface for meals, workouts, habits, supplements, and vitals, complete with circular progress indicators.
- [x] Implement database migrations with RLS for:
  - `meals`, `health_logs`, `workouts`, `supplements`, `supplement_logs`, `habits`, `habit_logs`. (Verified in 001_initial_schema.sql)
- [x] Build `/lib/ai/meals.ts`: Gemini endpoint estimating calories and macros from natural language strings with smart heuristic fallback.
- [x] Build meal logging drawer: Natural text input, Gemini estimation, manual override inputs (`user_edited: true`), and save action.
- [x] Build Today Dashboard:
  - Header with greeting, active streak flames, and Winter Arc focus quote.
  - Macro circular progress rings (Calories, Protein, Carbs, Fat, Water via SVG `ProgressRing`).
  - Daily habit checklist with instant optimistic check-offs and streak increments.
  - Recent logged meals and workouts feed.
- [x] Build Workout Logger (exercise, sets, reps, weight kg, duration).
- [x] Build Habits & Discipline Tracker with daily check-off pills and streak counters.
- [x] Build Vitals Tracker (weight, sleep, steps, mood, optional BP/glucose) with clinical bounds checks and medical safety disclaimers.
- [x] Connect Omnipresent Command Bar with `/api/command` for one-tap meal and water logging with mandatory confirmation cards.
- **Verification Criteria:**
  - Logging meals updates daily ring indicators immediately. (Verified)
  - Habit check-offs persist and reflect streak counts. (Verified)
  - Manual overrides for meals take precedence over Gemini estimates. (Verified)

---

### Phase 3: Reminders, Natural Language Events & Voice Input
**Goal:** Enable Alexa-style event creation with Gemini natural language parsing, mandatory confirmation cards, browser voice input, and Web Push notifications.
- [x] Create database migration for `events` and `push_subscriptions` with RLS. (Verified in 001_initial_schema.sql)
- [x] Implement `/lib/ai/events.ts`: Gemini function parsing natural speech/text (*"Dentist next Tuesday at 3pm with Dr. Smith"*) into structured ISO dates, people, and reminders with deterministic offline fallback.
- [x] Build Omnipresent Command Bar with Web Speech API audio transcription toggle and keyboard shortcut (`Cmd+K`).
- [x] Create Confirmation Card modal: Displays parsed event details with explicit "Confirm" and "Edit" buttons before database insertion (*"Sunday, 16 Nov, 5:00 PM: Meeting with Rahul. Save?"*).
- [x] Configure `web-push` VAPID generation and client subscription flow in Service Worker and `/api/push`.
- [x] Display upcoming scheduled events & reminders card on Today dashboard with check-off actions.
- [x] Unit test event date parsing and relative calculation in `tests/events.test.ts`.
- **Verification Criteria:**
  - Spoken and typed phrases parse into valid ISO timestamps. (Verified)
  - Events are NEVER inserted without user confirmation in the modal. (Verified)
  - Push notification successfully triggers on subscription test. (Verified)

---

### Phase 4: Personal Finances (Year-End View)
**Goal:** Provide an income/expense ledger, monthly category budgets, savings goals, and year-end projections that feed into the Winter Arc planner.
- [x] Create database migrations for `transactions`, `budgets`, and `goals_money` with RLS. (Verified in 001_initial_schema.sql)
- [x] Build Transaction Ledger: Categorized income and expense logging with date filtering.
- [x] Build Monthly Budget Manager: Category allocation progress bars and remaining spend counters.
- [x] Implement `/lib/calc/finance.ts`: Deterministic calculation for year-end savings projection based on trailing spending velocity and days remaining until Dec 31.
- [x] Build Money View dashboard with visual runway indicators.
- [x] Add unit tests in `tests/finance.test.ts` verifying calculation accuracy against known accounting figures.
- **Verification Criteria:**
  - Transaction math matches running balances to the cent. (Verified by Vitest test suite)
  - Projections accurately recalculate when new expenses are logged. (Verified)

---

### Phase 5: Grounded Ask-Your-Data Q&A Engine
**Goal:** Deliver a conversational query interface powered by Gemini function calling across all 8 user categories.
- [x] Create database migration for `notes` table (freeform user preferences) with RLS. (Verified in 001_initial_schema.sql)
- [x] Implement tool declarations and query executor in `/lib/ai/tools/grounding.ts` spanning all categories: Meals, Schedule, Health, Fitness, Habits, Money, and Notes.
- [x] Build `/api/ai/ask` endpoint executing function calls strictly within authenticated user context.
- [x] Build Chat UI on Ask screen: Displays conversation history, message status, and "Searching records..." state.
- [x] If data is missing for a given query, guarantee model explicitly outputs that records do not contain the answer.
- [x] Build User Preferences & Constraints Drawer for managing permanent facts (*"I don't eat after 9 pm"*).
- [x] Add unit tests in `tests/qa-tools.test.ts` verifying category query routing.
- **Verification Criteria:**
  - Asking *"What did I eat on Monday?"* calls `query_meals` and responds with exact database items. (Verified)
  - Asking about unrecorded data responds with *"not found in your records"*. (Verified)

---

### Phase 6: Double Verification Pipeline (Critical)
**Goal:** Implement the two-pass verification architecture to guarantee zero AI hallucinations.
- [x] Create database migration for `ai_audit` table. (Verified in 001_initial_schema.sql)
- [x] Implement `/lib/ai/pipeline/drafter.ts`: Generates structured claims with explicit cited record IDs.
- [x] Implement `/lib/ai/pipeline/verifier.ts`: Independent low-temperature call that evaluates claims strictly against cited records (`supported`, `partially_supported`, `unsupported`).
- [x] Implement `/lib/ai/pipeline/resolver.ts`: Filters out unsupported claims and replaces them with *"not in your records"*; aborts if failure rate > 50%.
- [x] Implement `/lib/ai/pipeline/math-check.ts`: Recalculates all sums, averages, and differences in TypeScript and overrides model arithmetic.
- [x] Implement `/lib/ai/pipeline/safety-rules.ts`: Enforces safe nutrition bounds and appends physician disclaimers for health vitals.
- [x] Add audit logging writing question, draft, verification verdict, and final answer to `ai_audit` via `/lib/ai/pipeline/audit.ts`.
- [x] Connect `/api/ai/ask` to run the complete 7-stage double verification pipeline.
- [x] Update Ask Screen UI: Render green "Verified" badge and expandable "Sources" drawer listing exact cited database records.
- [x] Unit test the pipeline resolver and master pipeline in `tests/verification.test.ts` and `tests/verification-pipeline.test.ts`.
- **Verification Criteria:**
  - Hallucinated claim injected into test draft is automatically caught and removed by the resolver. (Verified)
  - Every Q&A answer links to verifiable source records in the UI. (Verified)

---

### Phase 7: Winter Arc Weekly Planner
**Goal:** Synthesize profile biometrics, past 2-4 weeks of tracking history, financial budgets, and notes into an actionable 7-day tactical plan.
- [ ] Create database migration for `plans` table with RLS.
- [ ] Implement `/lib/ai/planner.ts`: Gathers historical context, invokes Gemini planner with strict weekly plan schema.
- [ ] Run generated weekly plan through Double Verification Pipeline and Health Safety rules.
- [ ] Build Plan Screen: Interactive 7-day Kanban/board view:
  - Daily workout assignments
  - Macro and meal schedule
  - Supplement checklist
  - Habit targets
  - Weekly budget limit
- [ ] Support drag-and-drop / manual edit of plan items.
- [ ] Interactive task completion check-offs with progress bar.
- **Verification Criteria:**
  - Plan respects dietary allergies and budget limits stored in the database.
  - Plan items can be checked off and saved persistently.

---

### Phase 8: Hardening, Accessibility, Polish & Deployment
**Goal:** Complete end-to-end testing, eliminate any forbidden anti-patterns, audit security parameters, and deploy to production on Vercel.
- [ ] Comprehensive design audit against `rules.md` (verify zero forbidden gradients, zero generic icons, zero low-contrast text).
- [ ] Accessibility review: Keyboard focus traps, screen reader labels, WCAG AA contrast compliance.
- [ ] Performance audit: Lighthouse score $\ge 90$ across Performance, Accessibility, and Best Practices.
- [ ] Security audit: Verify RLS on all 100% of tables, ensure zero secrets in client bundles, verify rate limiters.
- [ ] Deploy Supabase migrations to production database.
- [ ] Deploy Next.js frontend to Vercel with production environment variables.
- [ ] Write concise `README.md` with full setup, environment variables, and testing steps.
