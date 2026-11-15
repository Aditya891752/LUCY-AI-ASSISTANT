# Tech Stack - Lucy (Personal Life Assistant)

## 1. Core Framework & Language
| Technology | Version / Spec | Purpose & Rationale |
|---|---|---|
| **Next.js** | 15 (App Router) | Unified React fullstack framework. Server Components reduce bundle size; Server Actions / Route Handlers isolate AI keys and database credentials securely. |
| **TypeScript** | 5.x (Strict Mode) | Zero untyped variables (`noImplicitAny`, `strictNullChecks`). Enforces strict contracts between Zod schemas, DB models, and Gemini responses. |
| **React** | 19.x | Modern concurrent rendering, Server Components, and native form action handling. |

---

## 2. Styling, Design System & Animation
| Technology | Package | Purpose & Rationale |
|---|---|---|
| **Tailwind CSS** | `tailwindcss` | Utility-first styling with custom theme tokens. Clean, purposeful design tailored for the "Winter Arc" aesthetic without generic templates. |
| **Component Primitives** | Radix UI (`@radix-ui/*`) | Unstyled, accessible, keyboard-first primitives (Dialog, Popover, Dropdown, Tabs, Slider). |
| **Iconography** | Lucide React (`lucide-react`) | Clean vector icons used sparingly and with functional purpose (never decorative icon boxes in a row). |
| **Animations** | `framer-motion` | Physics-based spring animations for tab switches, confirmation drawers, ring transitions, and layout morphing. Smooth, never jarring. |
| **Data Visualization** | `recharts` | Responsive SVG charts for calorie/macro rings, body weight trends, blood pressure curves, and monthly budget progress. |

---

## 3. State Management & Data Fetching
| Technology | Package | Purpose & Rationale |
|---|---|---|
| **Server State Cache** | `@tanstack/react-query` v5 | Declarative data synchronization, optimistic UI mutations, automatic background refetching, and cache invalidation. |
| **Forms & Input** | `react-hook-form` | Uncontrolled form inputs with minimal re-renders. |
| **Schema Validation** | `zod` | Single source of truth for runtime validation. Shared across client forms, server endpoints, and Gemini structured output schemas. |

---

## 4. Backend & Database
| Technology | Package | Purpose & Rationale |
|---|---|---|
| **Database** | PostgreSQL (Supabase) | Relational integrity with full SQL expressiveness, indexing, and foreign key cascades. |
| **Authentication** | Supabase Auth (`@supabase/ssr`) | Secure HTTP-only cookie-based authentication, user session persistence, and instant token verification. |
| **Access Control** | PostgreSQL RLS | Kernel-level Row Level Security on 100% of tables (`auth.uid() = user_id`). |
| **Scheduled Tasks** | `pg_cron` / Supabase Edge Functions | Scheduled push notification dispatch for reminders and morning plan briefings. |

---

## 5. Artificial Intelligence Engine
| Technology | Package | Purpose & Rationale |
|---|---|---|
| **Official SDK** | `@google/genai` | Official Google Gen AI SDK for Node.js server routes. Ensures optimal streaming, tool calling, and structured JSON generation. |
| **Model Selection** | `GEMINI_MODEL` (e.g. `gemini-2.5-flash`) | Fast, cost-effective, reasoning-capable model configured via environment variable for zero-code model upgrades. |
| **Tool Calling** | Structured Gemini Function Calling | Maps natural language questions to database query tools (`query_meals`, `query_events`, etc.). |

---

## 6. PWA, Notifications & Voice
| Technology | Package | Purpose & Rationale |
|---|---|---|
| **PWA Service Worker** | `@serwist/next` | Service worker lifecycle, asset pre-caching, offline shell fallback, and push event listening. |
| **Web Push** | `web-push` | Server-side VAPID payload signing and delivery to browser push endpoints. |
| **Voice Interface** | Browser Web Speech API | Client-side audio transcription (`SpeechRecognition`) with graceful fallback to standard text input. |

---

## 7. Development & Quality Assurance
| Technology | Package | Purpose & Rationale |
|---|---|---|
| **Testing** | `vitest` | Ultra-fast unit testing for Mifflin-St Jeor math, verification resolvers, and date parsers. |
| **Linting & Formatting** | `eslint`, `prettier` | Strict code quality gates and formatting standards. |
| **Package Manager** | `npm` (`npm.cmd`) | Standard Node.js package management on Windows development workstation. |
