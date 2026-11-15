# Engineering & AI Operational Rules - Lucy

This document governs all code, UI components, backend routes, and AI interactions for the Lucy project. **Every agent, developer, and LLM touching this codebase must strictly adhere to these rules without exception.**

---

## 1. Strictly Forbidden UI & Design Anti-Patterns
Do not use or introduce any of the following patterns:
1. **NO purple-to-blue gradients** anywhere in the product.
2. **NO gradient hero text** (e.g., `bg-gradient-to-r from-... bg-clip-text text-transparent`).
3. **NO emojis in headings or titles** (keep headers clean, clear, and professional).
4. **NO Inter font everywhere** (use distinctive, crisp typography as defined in `design.md`).
5. **NO colored-border cards** (no neon/glowing borders or arbitrary multi-color card borders).
6. **NO glassmorphism cards** (no `backdrop-blur-md bg-white/10` milky glossy surfaces).
7. **NO low-contrast dark mode** (dark mode must have crisp, high-contrast text and backgrounds).
8. **NO 3 icon boxes in a row** (no generic marketing feature card grids).
9. **NO badges floating directly above headlines**.
10. **NO Lucide icons everywhere** (use icons only where they communicate clear utility; no decorative icon spam).
11. **NO untouched shadcn/ui defaults** (every component must be customized and branded).
12. **NO fade-in on scroll** gimmicks.
13. **NO cursor-following beams or ambient glow effects**.
14. **NO button fades on hover** (use crisp, tactile state changes: subtle scale, solid color shifts, crisp borders).
15. **NO inconsistent spacing** (strictly stick to the 4px / 8px spacing scale).
16. **NO excessive em dashes everywhere** in copy or headers.
17. **NO generic or weak passwords** in fixtures, seeds, or documentation.
18. **NO serif italic accents** in modern UI headings.
19. **NO Space Grotesk + Instrument Serif** combo clichés.
20. **NO grain overlays over gradients**.

---

## 2. Security & Architectural Non-Negotiables
Under no circumstances may any of the following exist in this repository:
1. **Zero Client Secrets:** NEVER include API keys, database credentials, or secret tokens in frontend code or client JS bundles.
2. **Zero Exposed Configs:** NEVER commit `.env`, `.env.local`, or secret configuration files to git.
3. **Zero Secrets in Git History:** All test credentials or fixture tokens must be dummy values and never real private keys.
4. **Zero Permissive Database Policies:** NEVER disable Row Level Security (RLS). Every table in Supabase must have RLS active with `auth.uid() = user_id` policies.
5. **Zero Public Storage Buckets:** All storage buckets must be private, accessed only via authenticated signed URLs or RLS policies.
6. **Mandatory Rate Limiting:** Rate limiting must protect all public API endpoints, authentication attempts, and AI generation routes.
7. **Zero Production Debug Flags:** Dev tools, sourcemaps with source code exposure, and debug loggers must be disabled in production builds.
8. **Zero Unprotected Admin Routes:** Admin and privileged routes must enforce server-side session and role validation before rendering or executing.
9. **Zero SQL/NoSQL Injections:** Use parameterized queries and Supabase client SDK methods exclusively; never concatenate user input into raw SQL.
10. **Secure Password Handling:** Passwords handled exclusively by Supabase Auth with bcrypt/argon2 hashing; never stored or logged in plain text.
11. **Zero Stack Traces to End Users:** Sanitize all errors on the server. Return safe, friendly error messages to the client; keep raw traces in server-only logs.
12. **Zero Client-Only Auth Checks:** UI hiding is not security. Every server route, server action, and API endpoint must independently verify authentication and authorization.

---

## 3. The Three Highest-Risk Fixes (Address First)

Whenever reviewing, configuring, or refactoring code, these three risks take absolute priority over everything else:

### High-Risk Fix #1: Overly Permissive Database Rules (RLS Off or World-Readable)
- **Risk:** Complete database compromise and mass user data exfiltration.
- **Rule:** Every Supabase table migration MUST begin with:
  ```sql
  ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
  ```
  Followed by explicit, non-bypassable policies:
  ```sql
  CREATE POLICY "Users can only access their own data"
  ON public.<table_name>
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  ```

### High-Risk Fix #2: API Keys, Secrets, or Service Role Keys in Frontend Bundles
- **Risk:** Full system impersonation, arbitrary database writes bypassing RLS, and billing exhaustion.
- **Rule:**
  - `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` must NEVER carry `NEXT_PUBLIC_` prefixes.
  - They must only be accessed inside `/lib/ai/`, `/app/api/`, or Server Actions.
  - Continuous CI check / pre-commit hook to reject commits containing secret regex patterns.

### High-Risk Fix #3: Auth Checks That Only Exist Client-Side
- **Risk:** Complete bypass of authentication via direct HTTP calls to API endpoints or server actions.
- **Rule:**
  - Do not rely on React components or redirects (`router.push('/login')`) for security.
  - Every API route and Server Action must call `createClient()` from `@supabase/ssr`, authenticate the session via `auth.getUser()`, and reject requests with `401 Unauthorized` before processing any payload.

---

## 4. Code Quality & AI Development Standards
- **Strict TypeScript:** No `any`. Use generics, interfaces, and Zod inference (`z.infer<typeof Schema>`).
- **Data Encapsulation:** All AI interactions reside in `/lib/ai/`; all database access logic resides in `/lib/db/`. Components remain purely presentational.
- **Double Verification Enforcement:** No AI response to user queries may be rendered without passing through the Verifier model and Code Calculation checks.
- **Deterministic Math:** Aggregations and nutritional totals must be calculated by TypeScript algorithms, not generated by an LLM.
