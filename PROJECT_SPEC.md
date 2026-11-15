# Personal Life Assistant: Project Spec

## 1. What we are building

A **personal assistant web app** that runs on the user's own stored data instead of a chatbot that forgets. The user first sets up a profile, then logs meetings, meals, health, workouts, supplements, habits and money. The app answers questions *only from that stored data* and builds a personalised plan from it.

**Why it exists:** ChatGPT, Gemini and Google Assistant forget things, make mistakes, and charge for long-term memory. This app gives permanent memory built around the user's own data and preferences, uses the Gemini API, and **double-checks every answer before showing it.**

**Theme:** "Winter arc". It is winter, year end is close, and users want discipline, workouts, better diets and a tidy budget. The UI and the planner should feel like a focused self-improvement tool.

**Primary user:** an individual (single user per account) who wants one place to plan, track and ask questions about their own life.

---

## 2. Core principles (the agent must follow these)

1. **Own-data first.** Answers about the user come from the database, never from the model's guesses.
2. **Double verification.** Every AI answer goes through a draft step and a verification step (see section 7). Unsupported claims are removed or labelled "not in your records".
3. **No silent forgetting.** Everything the user logs is persisted and retrievable.
4. **Interactive, fast frontend.** Smooth animations, instant feedback, mobile-first layout.
5. **Privacy.** The Gemini API key lives only on the server. Each user can only read their own rows.
6. **Safe health advice.** The app is not a doctor. No diagnoses. Show safe-range checks and a short disclaimer on health and diet advice.

---

## 3. Features

### 3.1 Onboarding profile (always first)
The app does not unlock until the profile is done. Features depend on it.
- **Gender:** Male / Female / Other / Prefer not to say. For calorie and health-range formulas, ask a follow-up: *"Which calculation baseline should we use?"* (Male / Female / Average). This keeps "Other" and "Prefer not to say" users fully supported.
- **Age, height, weight, activity level**
- **Goals:** fat loss, muscle gain, maintenance, discipline, savings
- **Diet preference:** veg / non-veg / vegan / eggetarian and any allergies the user chooses to enter
- **Wake time and sleep time**
- **Timezone:** default to the device timezone, editable

**What depends on the profile:** daily calorie and protein targets (Mifflin-St Jeor with the chosen baseline), water target, health reference ranges, workout suggestions, and the tone of the plan.

### 3.2 Reminders and meeting schedules (Alexa-style)
- The user types or speaks: *"Meeting with Rahul on Sunday 5 pm"*.
- Gemini parses it into structured data: title, date, time, people, location, notes.
- The app confirms what it understood in a small card (*"Sunday, 16 Nov, 5:00 PM: Meeting with Rahul. Save?"*) before saving.
- Reminders fire as web push notifications and in-app alerts (default 30 minutes and at the event time, editable).
- **Out of scope:** reading call logs or chats. Do not build this.
- Voice input uses the browser Web Speech API with a typed fallback where unsupported.

### 3.3 Meal tracker
- Log meals in plain language (*"2 rotis, dal, paneer sabzi"*). Gemini estimates calories and macros and returns structured data.
- The user can edit any estimate. Edited values win.
- Daily ring chart for calories, protein, carbs, fat and water against targets.
- Meal history by day and week.

### 3.4 Basic health tracker
- Weight, water, sleep hours, steps (manual), mood (1 to 5), and optional blood pressure and blood sugar entries.
- Trend charts over 7, 30 and 90 days.
- Reference-range check for the optional vitals, with a gentle *"consider talking to a doctor"* note when out of range. No diagnosis.

### 3.5 Fitness, supplements and habits
- Workout log (exercise, sets, reps, weight, duration).
- Supplement schedule with daily check-off and reminders.
- Habit tracker with streaks and a simple points and level system to build discipline.

### 3.6 Money (year-end view)
- Log income and expenses by category.
- Monthly budget, savings goal, and a year-end projection.
- Used by the planner so that diet and supplement suggestions respect the user's budget.

### 3.7 Ask-your-data Q&A ("folders")
Storage is organised into **categories** (not literal folders): Schedule, Meals, Health, Fitness, Supplements, Habits, Money, Notes.
- The user asks a question in natural language: *"What did I eat on Tuesday?"*, *"How many workouts did I do this month?"*, *"When is my meeting with Rahul?"*, *"Am I hitting my protein target?"*
- Gemini uses **function calling** with query tools (for example `query_meals(date_from, date_to)`, `query_events(...)`, `query_health(metric, range)`, `query_money(...)`) so it fetches exact rows instead of guessing.
- If the data is not there, the answer says so plainly.
- A **Notes** category lets the user store free-text facts and preferences (*"I don't eat after 9 pm"*) that the assistant must respect in future answers.

### 3.8 Winter Arc planner
- The user taps *"Generate my plan"*.
- Inputs: profile, last 2 to 4 weeks of logs, goals, budget, notes and preferences.
- Output: a **weekly plan** covering workouts, meals and calorie targets, supplement schedule, habit targets and a budget line, plus a short year-end checklist.
- The plan is saved, editable, and shown as an interactive weekly board. Items can be checked off.
- Plans go through the same double verification (section 7) and the health safety checks.

---

## 4. Tech stack (decided)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript (strict)** | One codebase for UI and secure server routes. Types prevent bugs in data-heavy code. |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, clean, consistent components. |
| Animation | **Framer Motion** | Smooth, interactive transitions, micro-interactions. |
| Charts | **Recharts** | Rings, bars and trend lines. |
| State and data | **TanStack Query + React hooks** | Instant, cached UI updates. |
| Forms and validation | **React Hook Form + Zod** | Same Zod schemas validate client input, server input and Gemini output. |
| Backend and DB | **Supabase** (Postgres, Auth, Row Level Security, Edge or cron for reminders) | Free tier, auth built in, per-user data isolation. |
| AI | **Gemini API** via official `@google/genai` SDK, called only from server routes | Key stays private. Model name set by env var `GEMINI_MODEL` (use latest Flash-class model available) so it can be swapped without code changes. |
| PWA and notifications | **Serwist** (or next-pwa) + Web Push | Installable on the phone, push reminders. |
| Voice | **Web Speech API** | No cost, no extra service. |
| Hosting | **Vercel** | Easy deploys from GitHub. |

### Environment variables (never commit them):
```env
GEMINI_API_KEY=
GEMINI_MODEL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

---

## 5. Data model (starting point)

Every table has `id`, `user_id` (references the auth user), `created_at`, and **Row Level Security** so users only access their own rows.

- `profiles`: gender, calc_baseline, dob or age, height_cm, weight_kg, activity_level, goals[], diet_pref, allergies[], wake_time, sleep_time, timezone, onboarding_complete
- `events`: title, starts_at, ends_at, people[], location, notes, remind_offsets[], status
- `meals`: eaten_at, description, calories, protein_g, carbs_g, fat_g, user_edited (bool)
- `health_logs`: logged_at, metric (weight, water_ml, sleep_h, steps, mood, bp_sys, bp_dia, glucose), value
- `workouts`: performed_at, exercise, sets, reps, weight_kg, duration_min
- `supplements`: name, dose, schedule, active; `supplement_logs`: supplement_id, taken_at
- `habits`: name, target_per_week; `habit_logs`: habit_id, done_on; plus points and streak fields
- `transactions`: occurred_on, amount, type (income or expense), category, note
- `budgets`: month, category, limit; `goals_money`: name, target, deadline
- `notes`: category, text, pinned
- `plans`: week_start, content (JSON), status, verification_report (JSON)
- `push_subscriptions`: endpoint, keys
- `ai_audit`: question, draft_answer, verification_result, final_answer (for debugging verification quality)

*The agent may refine this schema but must keep RLS on every table.*

---

## 6. App structure and UX

- Mobile-first, works well on desktop. Dark "winter arc" theme by default, with a light option.
- **Bottom navigation (mobile):** Today, Track, Ask, Plan, Money.
- **Today screen:** greeting, calorie and water rings, next 3 events, habit checklist with streak flames, one-line plan focus.
- **Command bar (always one tap away):** a single input for "log lunch: ...", "remind me ...", or a question. Gemini routes the text to the right action (meal, event, health log, question). Always show a confirmation card before saving anything.
- **Ask screen:** chat-style, with a small "Verified" badge and expandable "Sources" showing which records supported each claim.
- **Plan screen:** interactive weekly board with drag-and-drop and check-off.
- Use skeleton loaders, optimistic updates, and tasteful animations. Interactions should feel instant.
- Accessible: keyboard navigable, sufficient contrast, labelled inputs.

---

## 7. Double verification pipeline (critical)

For every Q&A answer and every generated plan:
1. **Retrieve.** Gemini calls the query tools; the server returns exact rows from the user's data.
2. **Draft.** Gemini produces a structured JSON answer: a list of claims, each with the record IDs that support it (or `supported: false` if none).
3. **Verify.** A second, separate Gemini call (verifier prompt, low temperature) receives only the claims and the cited records and checks each claim. Verdict per claim: `supported`, `partially_supported`, or `unsupported`.
4. **Resolve.** The server removes or rewrites unsupported claims. Anything left unverifiable is shown as *"not in your records"*. If too many claims fail, return *"I couldn't verify enough to answer"* instead of guessing.
5. **Numbers check in code.** Totals, averages and calorie math are computed by the server (not by the model) and compared with what the model stated.
6. **Health safety check.** For health, diet and supplement advice, run a safety rule layer: no diagnoses, no extreme calorie targets, flag values outside safe ranges, add a short disclaimer.
7. **Log everything to `ai_audit`.**

*All model outputs must be requested as structured JSON and validated with Zod before use. Invalid output triggers one retry, then a graceful error.*

---

## 8. Build phases (do them in order, and stop after each for review)

- **Phase 0: Setup.** Next.js + TypeScript strict, Tailwind, shadcn/ui, Framer Motion, Supabase project and auth, env handling, base layout, PWA shell.
- **Phase 1: Onboarding and profile.** Gated onboarding flow, profile storage, target calculations (calories, protein, water).
- **Phase 2: Trackers.** Meals (with Gemini estimation), health logs, workouts, supplements, habits, Today dashboard with rings and charts.
- **Phase 3: Reminders.** Natural-language event parsing, confirmation card, voice input, web push and in-app reminders, scheduled delivery.
- **Phase 4: Money.** Transactions, budgets, savings goals, year-end projection.
- **Phase 5: Ask-your-data Q&A.** Query tools, function calling, Notes category, Sources panel.
- **Phase 6: Double verification.** Full pipeline from section 7 applied to Q&A.
- **Phase 7: Winter Arc planner.** Plan generation, verification, interactive weekly board.
- **Phase 8: Polish.** Animations, empty states, error states, accessibility pass, deploy to Vercel.

---

## 9. Rules for the agent

- Use TypeScript strict mode. No `any` unless justified in a comment.
- Never expose `GEMINI_API_KEY` or the service role key to the browser.
- Share Zod schemas between client, server and model-output validation.
- Keep components small and reusable. Keep AI logic in a `/lib/ai` folder and database access in `/lib/db`.
- Write a short README with setup steps and env variable descriptions.
- Add basic tests for target calculations, the verification resolver and date parsing.
- After each phase, summarise what was built and what to test, then wait for approval.
- If something in this spec is unclear or conflicts with a technical constraint, ask before improvising.

---

## 10. Out of scope (for now)

- Call log or chat reading
- Native mobile apps
- Multi-user or social features
- Wearable integrations
- Paid plans or billing

---

## 11. Definition of done for the first release

A user can sign up, complete onboarding, log meals, health data, workouts and habits, create reminders by typing or speaking, receive a push notification at the right time, ask questions that are answered only from their own data with a visible "Verified" badge, and generate an editable weekly Winter Arc plan, all on a fast, animated, installable web app.
