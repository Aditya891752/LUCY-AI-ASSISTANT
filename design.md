# Design System & UI Specification - Lucy

## 1. Aesthetic Direction: "Winter Arc"
The Winter Arc visual identity is defined by **discipline, laser focus, tactical precision, and zero superfluous ornamentation**. It evokes the mindset of someone training in the cold, tracking their metrics with mathematical rigor, and executing daily habits without excuses.

- **Look & Feel:** High-contrast, tactile, engineered, structured.
- **Anti-Trends Strictly Rejected:** No purple-to-blue gradients, no gradient hero copy, no blurred glassmorphism, no floating badges, no decorative icon box trios, no cursor-following ambient lights.
- **Micro-Interactions:** Fast, crisp, physics-grounded spring transitions (150ms-250ms), instantaneous feedback.

---

## 2. Color Palette & Theming

### 2.1 Dark Mode (Primary "Winter Arc" Theme)
Engineered for deep focus and maximum readability in low-light environments without muddy grays.
- **Background Root:** `#090A0F` (Deep tactical midnight black)
- **Surface Elevation 1 (Cards, Panels):** `#11131A` (Solid matte dark slate)
- **Surface Elevation 2 (Inputs, Modals):** `#181B24` (Elevated solid slate)
- **Border Neutral:** `#232734` (Crisp 1px structural boundary, zero glowing neon borders)
- **Border Active / Focused:** `#3E465B`
- **Text Primary:** `#F3F4F6` (High-contrast pure white/gray - 16:1 contrast ratio)
- **Text Secondary / Muted:** `#9CA3AF` (Legible slate gray)
- **Tactical Accent (Ice Steel):** `#38BDF8` (Crisp winter frost cyan, used strictly for active states, data rings, and verified badges)
- **Discipline Accent (Amber Fire):** `#F59E0B` (Used strictly for streaks and habit flames)
- **Success Accent:** `#10B981` (Crisp emerald green for verified badges and completed targets)
- **Warning / Alert:** `#EF4444` (Crisp crimson for budget overruns or out-of-range clinical vitals)

### 2.2 Light Mode (Clean Editorial Minimalist)
- **Background Root:** `#F8FAFC`
- **Surface Elevation 1:** `#FFFFFF`
- **Border Neutral:** `#E2E8F0`
- **Text Primary:** `#0F172A`
- **Text Secondary:** `#64748B`
- **Tactical Accent:** `#0284C7`

---

## 3. Typography Hierarchy

**Font Family:** `Geist Sans` or `Plus Jakarta Sans` for UI & numbers (distinctive, legible, geometric yet warm; **avoiding generic Inter** everywhere). Monospace digits via `Geist Mono` or `JetBrains Mono` for macro rings, stopwatch timers, and financial balances.

| Level | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display / Metric** | 36px / 2.25rem | 700 Bold | 1.1 | -0.02em | Macro numbers, streak counters |
| **Heading 1 (H1)** | 24px / 1.5rem | 600 SemiBold | 1.25 | -0.015em | Screen titles (Today, Track, Plan) |
| **Heading 2 (H2)** | 18px / 1.125rem | 600 SemiBold | 1.3 | -0.01em | Card headers, section dividers |
| **Body Primary** | 15px / 0.9375rem | 400 Regular | 1.5 | 0 | Descriptions, logs, Q&A responses |
| **Body Strong** | 15px / 0.9375rem | 500 Medium | 1.5 | 0 | Active list items, labels |
| **Caption / Label** | 12px / 0.75rem | 500 Medium | 1.4 | +0.02em | Macro tags, timestamps, source IDs |

*Note: Headings never use emojis, italic serifs, or gradient text clips.*

---

## 4. Spacing, Grid & Layout Rhythm

Strict 4px/8px modular spacing system:
- **`space-1` (4px):** Micro gaps between icons and labels.
- **`space-2` (8px):** Padding inside small badges, gaps between inline chips.
- **`space-3` (12px):** Compact card padding, input internal padding.
- **`space-4` (16px):** Standard card padding, list item vertical spacing.
- **`space-6` (24px):** Section gap on mobile layouts.
- **`space-8` (32px):** Screen header bottom margin.

### Mobile-First Layout Grid
- Mobile width: Full-bleed with `px-4` (16px) gutter padding. Max screen container width: `480px` on mobile, centered up to `768px` on tablet / `1024px` on desktop.
- Touch target minimum: `44px x 44px` for all interactive buttons and inputs.

---

## 5. Core Component Design Guidelines

### 5.1 Bottom Navigation Bar (Mobile)
- Fixed bottom dock (`h-16`), solid background `#090A0F` with a crisp 1px top border `#232734`.
- 5 primary tabs: **Today**, **Track**, **Ask**, **Plan**, **Money**.
- Active state: Crisp accent color with subtle tactile indicator (no glowing shadows).

### 5.2 Floating Command Bar (Always One-Tap Away)
- Centered dock or quick hotkey (`Cmd+K` / floating mic & text trigger).
- Expands to full-width tactical input with instant suggestion pills (*"Log meal"*, *"Add reminder"*, *"Check protein"*).
- Instant audio waveform indicator when recording voice commands via Web Speech API.

### 5.3 Confirmation Cards
- Renders immediately after Gemini parses a command.
- Shows structured key-value pairs (Title, Date, Time, Calories, Macros) in an editable form.
- Action buttons: Primary solid "Save Record" and secondary "Cancel / Edit".

### 5.4 Macro & Health Rings
- SVG-based circular progress indicators (`recharts` / custom SVG stroke-dasharray).
- Smooth entry animation via Framer Motion spring physics.
- Displays consumed vs. target values in legible tabular numbers.

### 5.5 Tactile Buttons
- Solid matte fill with high-contrast text.
- Interaction state: Instant scale press (`scale-98`) and crisp border highlight. **No fading opacity transitions.**
