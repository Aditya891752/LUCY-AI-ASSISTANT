# Lucy — Personal Life Assistant (Winter Arc Edition)

Lucy is a high-integrity, ground-truth personal life assistant web application built on **Next.js 15 (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS**, and **Supabase (PostgreSQL with Row Level Security)**. 

Unlike mainstream AI assistants that suffer from context amnesia and fabricate numbers, Lucy answers questions and builds tactical weekly plans **strictly from your stored database rows** through a **7-Stage Double Verification Pipeline**.

---

## The Three Highest-Risk Security Guarantees (Addressed First)

1. **Row Level Security (RLS) on 100% of Tables:**
   - Every single PostgreSQL table in [`supabase/migrations/001_initial_schema.sql`](file:///d:/LUCY-AI-ASSISTANT/supabase/migrations/001_initial_schema.sql) has RLS enabled with `auth.uid() = user_id` policies for all operations. World-readable access is strictly blocked at the database kernel.
2. **Zero Client Secrets Exposure:**
   - `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are isolated to server routes only and never carry `NEXT_PUBLIC_` prefixes. Client bundles never contain private keys.
3. **Server-Side Authentication Verification:**
   - Authentication is never trusted to client-side UI redirects alone. Every Server Action, API endpoint, and Route Handler calls `@supabase/ssr` `auth.getUser()` and denies unauthorized requests before processing payloads.

---

## Core Features

- **Gated Onboarding & Target Calculations:**
  - Multi-step wizard enforcing gender baselines (Male, Female, Average) and biometric demographics.
  - Deterministic **Mifflin-St Jeor engine** calculating daily BMR, TDEE, protein floor, and hydration targets.
- **Track & Log Suite:**
  - **Meals:** Plain language logging (*"2 rotis, dal, paneer sabzi"*) with Gemini macro estimation and instant manual overrides (`user_edited: true`).
  - **Health Vitals:** Morning weight, sleep hours, manual steps, mood score (1 to 5), and clinical vitals (blood pressure & glucose) with gentle, non-diagnostic medical disclaimers.
  - **Workouts:** Sets, reps, weights (kg), and training duration.
  - **Habits & Supplements:** Discipline check-offs with active streak flames.
- **Dynamic Fuel & Hydration Rings:**
  - SVG progress rings for Calories, Protein, and Water on the Today Dashboard with quick hydration increments (`+250ml`, `+500ml`).
- **Alexa-Style Reminders & Events:**
  - Natural language parsing (*"Meeting with Rahul on Sunday 5 pm"*) with a mandatory confirmation card before saving, Web Speech API audio input, and Web Push notifications.
- **Personal Finances (Year-End View):**
  - Income and expense tracking, category budget progress bars, and year-end runway projections to keep meal recommendations within financial reality.
- **Ask-Your-Data Q&A Engine:**
  - Ground-truth queries across 8 categories with verifiable source citations and user-defined constraints (*"I don't eat after 9 pm"*).
- **Winter Arc Weekly Planner:**
  - Interactive 7-day tactical board covering workout splits, nutritional focus, supplement protocols, and year-end discipline checklists.

---

## Design System: "Winter Arc" Aesthetic

- **Color Tokens:** Tactical dark theme (`#090A0F` root, `#11131A` cards, `#38BDF8` frost cyan accent, `#F59E0B` fire amber).
- **Anti-Pattern Compliance:** Zero purple-to-blue gradients, zero gradient hero text, zero emojis in headings, zero glassmorphism, zero 3-icon box grids, zero button opacity fades on hover, strict 4px/8px modular rhythm.

---

## Local Development Setup

### 1. Prerequisites
- Node.js v20+ or v24+
- npm v10+

### 2. Installation
```powershell
# Clone the repository
git clone https://github.com/your-username/lucy-ai-assistant.git
cd lucy-ai-assistant

# Install dependencies
npm install
```

### 3. Environment Variables
Copy the template configuration:
```powershell
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:
```env
# Public Supabase Client (Safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-Only Private Credentials (CRITICAL: NEVER PREFIX WITH NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Web Push VAPID Keys (Generate with `npx web-push generate-vapid-keys`)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 4. Database Setup
1. In the [Supabase Console](https://supabase.com), open the **SQL Editor**.
2. Run [`supabase/migrations/001_initial_schema.sql`](file:///d:/LUCY-AI-ASSISTANT/supabase/migrations/001_initial_schema.sql).
3. Verify that Row Level Security is active on all 16 tables.

### 5. Running the Application
```powershell
# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Running the Automated Test Suite

Lucy includes 20 automated unit and integration tests across 7 test suites:
```powershell
npx vitest run
```
Tests cover:
- Mifflin-St Jeor target calculations and safety calorie floors (`tests/targets.test.ts`)
- Double verification claim resolver & failure thresholds (`tests/verification.test.ts`)
- Event natural language date/time parsing (`tests/events.test.ts`)
- Deterministic financial accounting and runway calculations (`tests/finance.test.ts`)
- Ground-truth query tool routing (`tests/qa-tools.test.ts`)
- End-to-end 7-stage double verification pipeline (`tests/verification-pipeline.test.ts`)
- Weekly planner schema validation (`tests/planner.test.ts`)

---

## Production Deployment to Vercel

1. Push your repository to GitHub.
2. In Vercel, click **Add New -> Project** and import `lucy-ai-assistant`.
3. In the **Environment Variables** panel, inject:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
4. Click **Deploy**. Vercel will build and launch your production web app.
