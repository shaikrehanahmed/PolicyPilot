# PolicyPilot — Release & Demonstration Verification Checklist

This pre-flight checklist must be verified and executed prior to submitting any milestone release or initiating an evaluation walkthrough.

---

## 1. Code Quality & Build Integrity Gate

- [ ] **Frontend Production Build Passes:** `npm run build` inside `apps/web` executes cleanly with zero TypeScript or build errors.
- [ ] **Frontend Lint Check Passes:** `npm run lint` reports zero critical errors.
- [ ] **Backend Tests Pass:** `pytest` inside `services/api` passes with 100% of test cases green.
- [ ] **Code Formatting Clean:** Backend passes `ruff check app/` with no syntax or import errors.
- [ ] **No Secrets Committed:** Git diff confirms `.env`, API keys, private keys, and real credentials are NOT committed.

---

## 2. Database & Data Ingestion Gate

- [ ] **PostgreSQL Connected:** Database responds to connections with valid credentials.
- [ ] **pgvector Extension Verified:** `SELECT * FROM pg_extension WHERE extname = 'vector';` returns positive.
- [ ] **Migrations Applied:** `alembic upgrade head` completes with 0 errors.
- [ ] **Seed Data Loaded:** Seed script loads 5–6 verified official schemes, documents, and criteria into PostgreSQL.
- [ ] **Vector Embeddings Ready:** Document chunk embeddings are stored with the configured dimension and indexed via HNSW.

---

## 3. Core Engine & Business Logic Gate

- [ ] **Deterministic Rule Engine Verified:** Pure Python rule engine correctly evaluates:
  - `ELIGIBLE` when all conditions match.
  - `NOT_ELIGIBLE` when any condition fails (with explicit failure reason).
  - `PARTIALLY_ELIGIBLE` when information is missing.
  - `MISSING_INFORMATION` when critical profile attributes are omitted.
- [ ] **Zero Hallucination Guarantee:** Verified that the LLM is NEVER called to calculate or override eligibility logic.
- [ ] **RAG Evidence Retrieval Works:** Top vector chunks are retrieved, formatted with source tier, and citations match original document text.
- [ ] **Prompt Injection Defense Active:** Retrieved evidence is wrapped in `<evidence>` delimiters and instructions inside evidence chunks are ignored.

---

## 4. Evaluator Scenarios & Demo Features Gate

- [ ] **Intentional Conflict Scenario Works:** When navigating to the designated conflicting scheme, the UI renders the prominent `CONFLICT DETECTED` banner displaying both divergent source dates and values without guessing.
- [ ] **Intentional Stale Source Scenario Works:** When inspecting a scheme with an older verification timestamp, the UI renders the `STALE SOURCE` indicator.
- [ ] **Personalized Action Plan Generated:** The LangGraph action-plan node successfully drafts step-by-step document and deadline guidance based strictly on verified requirements.
- [ ] **Server-Sent Events / Progress Stream Works:** The UI demonstrates live graph progress transitions across:
  `NORMALIZING PROFILE` → `DISCOVERING SCHEMES` → `EVALUATING RULES` → `VERIFYING SOURCES` → `CHECKING DOCUMENTS` → `PREPARING ACTION PLAN`.

---

## 5. End-to-End User Journey Walkthrough Gate

- [ ] **Route 1: `/` (Landing Page)** — Headline, value proposition, journey diagram, and featured schemes render cleanly without fake statistics or claims.
- [ ] **Route 2: `/login` & `/signup`** — Renders clear branding, input validation, and an immediate **Guest / Demo Walkthrough** bypass button.
- [ ] **Route 3: `/profile`** — Stepper demographic onboarding completes smoothly using privacy-friendly bands.
- [ ] **Route 4: `/schemes`** — Discovery returns ranked relevant schemes with category badges and freshness chips.
- [ ] **Route 5: `/schemes/[id]`** — Detailed scheme page displays:
  - Clear Status Badge (`ELIGIBLE`, `PARTIALLY_ELIGIBLE`, etc.).
  - Criteria Table with individual pass/fail breakdowns.
  - Evidence Drawer with direct quotes, source URLs, and timestamps.
  - Action Plan with verified document checklist and application link.
- [ ] **Route 6: `/sources`** — Source registry shows official government publishers and last verified dates.

---

## 6. Infrastructure & Health Gate

- [ ] **Health Endpoint Returns 200:** `GET /api/health` reports status `healthy` with database and vector statuses positive.
- [ ] **Readiness Endpoint Returns 200:** `GET /api/ready` successfully executes sample query.
- [ ] **Responsive Viewport Checks:** Verified on Desktop (1440px), Tablet (768px), and Mobile (390px) without horizontal scroll or clipping.
