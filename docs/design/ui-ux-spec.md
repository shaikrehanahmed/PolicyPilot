# PolicyPilot — UI/UX Design & Implementation Specification

This document defines the visual direction, design tokens, component architecture, responsive breakpoints, route layouts, and visual quality review gates for PolicyPilot.

---

## 1. Authority, Scope & Art Direction

- **Product Identity:** POLICYPILOT — Evidence-Grounded Policy Navigation
- **Design Philosophy:** Premium civic technology meets modern productivity tool. Calm, trustworthy, approachable, and authoritative.
- **Visual Reference Inspection Note:** The designated reference path is `docs/design/references/policypilot-visual-reference.png`. Upon filesystem inspection during setup, this file was not pre-existing on disk. The directory has been scaffolded, and all visual design specifications below strictly implement the comprehensive written Master UI/UX Design Addendum.

### Anti-Patterns Explicitly Prohibited
- Generic AI dashboards with dark purple overload
- Excessive glassmorphism or muddy blur filters
- Cartoon AI robots or fake government emblems/seals
- Fake user testimonials, fake partner badges, or fabricated statistics
- Meaningless 3D canvas libraries (Three.js/WebGL/GSAP bloat)

---

## 2. Design Tokens & Styling Architecture

The design tokens are centralized in Tailwind CSS and CSS variables:

### 2.1. Color Palette

| Token Name | Hex Value | Purpose | Accessibility (WCAG 2.1) |
|---|---|---|---|
| `--color-background` | `#F7F8FC` | Main application background (soft neutral) | Base canvas |
| `--color-surface` | `#FFFFFF` | Cards, modals, drawers, input backgrounds | High contrast |
| `--color-text-primary` | `#17213F` | Headings, primary text, labels | 13.5:1 on background (AAA) |
| `--color-text-secondary`| `#667085` | Subtitles, captions, metadata | 4.8:1 on background (AA) |
| `--color-primary` | `#4F46E5` | Primary action buttons, active states (Indigo) | 5.2:1 on background (AA) |
| `--color-secondary` | `#7C3AED` | Secondary accents, progress glow (Violet) | Subtle accent |
| `--color-border` | `#E5E7EB` | Card borders, table dividers, inputs | 1px clean lines |
| `--color-status-success`| `#15803D` | `ELIGIBLE` badge, verified checks (Green) | 4.6:1 contrast |
| `--color-status-warning`| `#B45309` | `PARTIALLY_ELIGIBLE`, `STALE SOURCE` (Amber) | 4.8:1 contrast |
| `--color-status-error` | `#B91C1C` | `NOT_ELIGIBLE`, `CONFLICT DETECTED` (Crimson) | 5.1:1 contrast |

### 2.2. Typography System
- **Primary Font Family:** `Geist Sans`, `Inter`, or system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`).
- **Scale:**
  - `Display / Hero Headline:` 40px – 48px, Bold (700), line-height 1.15
  - `H1 (Page Title):` 30px – 36px, Semi-Bold (600), line-height 1.2
  - `H2 (Section Header):` 22px – 24px, Semi-Bold (600), line-height 1.3
  - `H3 (Card Title):` 18px – 20px, Medium (500), line-height 1.4
  - `Body Regular:` 15px – 16px, Normal (400), line-height 1.5
  - `Body Small / Caption:` 13px – 14px, Normal (400), line-height 1.4
  - `Micro / Tag:` 11px – 12px, Medium (500), uppercase tracking

### 2.3. Elevation & Radius
- **Border Radius:**
  - Small (Inputs, buttons, badges): `6px` (`rounded-md`)
  - Cards, panels: `12px` (`rounded-xl`)
  - Modals, drawers: `16px` (`rounded-2xl`)
- **Shadows:**
  - Card base: `0 1px 3px 0 rgba(16, 24, 40, 0.05), 0 1px 2px 0 rgba(16, 24, 40, 0.03)`
  - Card hover: `0 4px 12px -2px rgba(16, 24, 40, 0.08)`
  - Focus glow: `0 0 0 3px rgba(79, 70, 229, 0.15)`

---

## 3. Component & Template Strategy

1. **Base Component Library:** `shadcn/ui` (accessible Radix primitives with Tailwind CSS).
2. **Icons:** `lucide-react` for clean, consistent iconography.
3. **Motion:** Selective micro-interactions using standard CSS transitions or lightweight Framer Motion:
   - Button hover/tap: `150ms ease-out`
   - Card lift: `200ms ease-out`
   - Drawer slide: `250ms cubic-bezier(0.16, 1, 0.3, 1)`
   - Full support for `prefers-reduced-motion: reduce`.
4. **Custom Visuals:** Pure CSS/SVG vector illustrations for journey diagrams and status indicators.

---

## 4. Route-by-Route Layout & Specifications

### 4.1. Route: `/` (Landing Page)
- **Header:** PolicyPilot logo, "How it Works", "Explore Schemes", "About", "Sign In" button, and "Get Started" CTA.
- **Hero Section:**
  - Eyebrow: `EVIDENCE-GROUNDED POLICY NAVIGATION`
  - Headline: `Find the right schemes. Understand your next steps.`
  - Supporting Copy: `Discover potentially relevant government schemes, understand their eligibility criteria, review official evidence and prepare a personalized application action plan.`
  - Action Buttons: `Explore Schemes` (Primary, Indigo), `Sign in` (Secondary / Ghost).
  - Hero Journey Visual: CSS/SVG interactive diagram illustrating:
    `USER PROFILE → SCHEME DISCOVERY → ELIGIBILITY → VERIFIED EVIDENCE → ACTION PLAN`
- **Workflow Demonstration Section:** Visual comparison showcasing deterministic rules vs. AI summarization.
- **Featured Schemes Grid:** 3–4 live cards drawn from verified seed data.
- **No-Fabrication Guarantee:** Explicit notice that all criteria trace to official Gazette notifications.

### 4.2. Routes: `/login` & `/signup`
- Clean two-column or centered container on `#F7F8FC`.
- Email & password inputs with client-side validation.
- Prominent **"Continue as Guest / Evaluator Walkthrough"** button allowing judges to experience the full app without sign-up friction.

### 4.3. Route: `/profile` (Demographic Onboarding)
- Step-by-step onboarding wizard:
  - Step 1: Basic Profile (State of Residence, Age Band)
  - Step 2: Economic Factors (Annual Household Income Band, Occupation)
  - Step 3: Social & Special Categories (Social Category, Landholding size, Disability status)
  - Step 4: Primary Goal (e.g. Higher Education, Farming Subsidy, Healthcare, Housing)
- Privacy Shield Notice: Informs user that only demographic bands are stored with encryption.

### 4.4. Route: `/schemes` (Scheme Discovery)
- Filter Bar: Category filters (Agriculture, Education, Healthcare, Housing, Social Welfare) and search bar.
- Scheme Cards:
  - Scheme Name, Publisher / Ministry, Target Group
  - Category Badge & State/Central Level Badge
  - Relevance Rationale (RAG-ranked)
  - Freshness Chip (`VERIFIED`, `STALE`, etc.)
  - Call to Action: `View Eligibility & Evidence →`

### 4.5. Route: `/schemes/[id]` (Eligibility, Evidence & Action Plan)
- **Top Banner:** Scheme Overview + Official Application Portal Link.
- **Eligibility Summary Banner:**
  - Large Status Badge: `ELIGIBLE` (Green), `PARTIALLY_ELIGIBLE` (Amber), `NOT_ELIGIBLE` (Red), or `UNDETERMINED` (Gray).
  - Plain-language AI summary explaining the outcome.
- **Conflict / Stale Banners:**
  - If conflicting: Alert banner highlighting both conflicting sources with their respective dates and values.
  - If stale: Warning banner noting source verification date > 180 days.
- **Criteria Evaluation Table:**
  - Columns: Criterion Name | Rule Condition | Your Profile Value | Evaluation Status (`PASS` / `FAIL` / `MISSING`) | Supporting Evidence
- **Evidence Drawer / Panel:**
  - Clicking a criterion opens exact official quote, document title, page number, and source URL.
- **Action Plan & Document Checklist:**
  - Required documents list with preparation guidance.
  - Chronological application steps with official direct link.

### 4.6. Route: `/sources` (Source Registry)
- Auditable registry of all government gazettes, portals, and PDFs ingested in PolicyPilot.
- Displays Publisher, Trust Tier (1–5), Last Verified Date, and Content Hash.

---

## 5. Agentic AI Processing Experience

When `/api/analyze` is triggered, the UI renders a live workflow indicator streaming Server-Sent Events (SSE) from LangGraph:

```
[●] NORMALIZING PROFILE
 └─ Coercing demographic bands and category enums

[●] DISCOVERING SCHEMES
 └─ Vector similarity matching and semantic ranking over official guidelines

[●] EVALUATING RULES
 └─ Deterministic Python engine executing rule formulas (No LLM)

[●] VERIFYING SOURCES
 └─ Cross-referencing claims and calculating document freshness

[●] CHECKING DOCUMENTS & DEADLINES
 └─ Querying official requirements and deadline schedules

[●] PREPARING ACTION PLAN
 └─ Synthesizing verified action items and application links
```

- **Honesty Rule:** Never simulate progress or fake steps. Every indicator updates only upon receiving actual backend events.

---

## 6. Responsive Viewport Standards

All layouts must be tested and verified at:
- **Desktop:** `1440 × 900`
- **Tablet:** `768 × 1024`
- **Mobile:** `390 × 844`
- **Narrow Mobile:** `360 × 640`

Key responsive checks:
- No horizontal scrolling or content clipping.
- Tables collapse gracefully into stacked criteria cards on mobile.
- Touch targets for buttons and form controls meet the minimum 44 × 44px standard.

---

## 7. Visual Quality Verification Protocol

During Phase 4 (Frontend), every primary screen must undergo visual inspection:
1. Start dev server and open in browser.
2. Capture screenshot saved to `docs/design/screenshots/`.
3. Compare against this specification for typography, spacing, and contrast.
4. Correct layout defects before marking the phase complete.
