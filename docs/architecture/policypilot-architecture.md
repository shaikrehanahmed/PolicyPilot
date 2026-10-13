# PolicyPilot — System Architecture Specification (Phase 1 of 5)

This document represents the technical source of truth for PolicyPilot, preserving all architectural choices, technical contracts, data models, and component boundaries established in the Claude Phase-1 Architecture.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ 1 PRESENTATION   Next.js (App Router, TS, Tailwind)          │
│   Profile → Discovery → Eligibility → Evidence → Action Plan │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS, JSON (typed client from OpenAPI)
┌───────────────────────────▼──────────────────────────────────┐
│ 2 API / APPLICATION   FastAPI + Pydantic                     │
│   /profile /discovery /eligibility /verification             │
│   /action-plan /schemes /sources /health                     │
│   auth middleware · rate limit · request-id · error mapper   │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│ 3 ORCHESTRATION   LangGraph (typed state, conditional edges) │
│   normalize → discover → ELIGIBILITY → verify → docs → plan  │
└───────┬───────────────┬───────────────┬──────────────────────┘
        │               │               │
┌───────▼──────┐ ┌──────▼───────┐ ┌─────▼─────────────────────┐
│ 4 RULES      │ │ 5 RETRIEVAL  │ │ LLM Gateway (abstracted)  │
│ deterministic│ │ pgvector +   │ │ explain / extract / rank  │
│ evaluator    │ │ filters +    │ │ NEVER decides eligibility │
│ (no LLM)     │ │ rerank       │ │                           │
└───────┬──────┘ └──────┬───────┘ └───────────────────────────┘
┌───────▼───────────────▼──────────────────────────────────────┐
│ 6 DATA   PostgreSQL: relational tables + pgvector            │
│   business rules (relational/JSONB) ≠ embeddings (chunks)    │
└───────────────────────────▲──────────────────────────────────┘
┌───────────────────────────┴──────────────────────────────────┐
│ 7 SOURCE / VERIFICATION                                      │
│   Seed loader (demo) + Ingestion worker (live, on demand)    │
│   fetch → extract → sanitize → chunk → embed → hash → store  │
└──────────────────────────────────────────────────────────────┘
 8 SECURITY / OBSERVABILITY: cross-cutting (auth, audit, traces)
```

**Knowledge Path:**
Official source → ingest → normalize → chunk + metadata → embed → Postgres/pgvector → retrieval → agents → cited evidence.

**Core Architectural Decision: Modular Monolith**
- **Why:** Single repository and unified deployment allow judges to audit the entire system seamlessly with zero distributed failure points.
- **Trade-off:** Components do not scale independently per service.
- **How:** Strict module boundaries (`rules/`, `retrieval/`, `agents/`, `llm/`) ensure any module can be extracted into an independent microservice in the future if required.

---

## 2. Where AI, Rules, and RAG Sit

| Concern | Mechanism | Why |
|---|---|---|
| **Profile normalization** | Pydantic + deterministic mapping | Coerces user income to annual INR, standardizes category enums and ISO state codes. |
| **Scheme discovery** | **RAG + LLM ranking** | Fuzzy semantic matching of citizen profile and goals to government schemes. |
| **Eligibility evaluation** | **Rule engine only (Pure Python)** | Auditable, reproducible, zero hallucination risk. LLM is never permitted to determine eligibility. |
| **Criteria extraction from documents** | LLM (offline, human-reviewed into seed) | Rules are curated and human-verified, never hallucinated at demo runtime. |
| **Verification** | **RAG + deterministic comparison** + LLM summary | Compares rule criteria values against values in retrieved evidence chunks. |
| **Conflict detection** | Deterministic diff of structured claims | Divergences between sources are surfaced explicitly; never resolved silently. |
| **Explanations / Action plan prose** | **LLM**, strictly constrained to supplied facts | The LLM explains and summarizes; it never decides or invents. |

**Key Trade-Off:** Curating structured rules requires seed effort, but makes eligibility trustworthy. For 5–10 schemes, verified rules can be accurately encoded and cited.

---

## 3. LangGraph Orchestration State Graph

### 3.1. Typed State Definition
```python
from typing import TypedDict

class PolicyState(TypedDict):
    request_id: str
    raw_profile: dict
    profile: NormalizedProfile | None
    missing_profile_fields: list[str]
    goal: str
    candidates: list[Candidate]               # discovery output
    eligibility: dict[str, EligibilityResult]  # scheme_id -> result
    verification: dict[str, VerificationResult]# scheme_id -> verification
    doc_checks: dict[str, DocDeadlineInfo]     # scheme_id -> doc info
    action_plan: ActionPlan | None
    errors: list[NodeError]
    trace: list[TraceEvent]                   # observability
```

### 3.2. Graph Control Flow
```
START
  │
  ▼
PROFILE_NORMALIZE ──(required fields missing)──► REQUEST_MISSING_INFO ──► END (returns questions)
  │
  ▼
DISCOVERY (retrieve → LLM rank over retrieved only)
  │──(no candidates / no reliable source)──► NO_SOURCE_RESPONSE ──► END
  ▼
ELIGIBILITY_ENGINE (per candidate, pure Python)
  │──(engine error)──► MARK_UNDETERMINED (never guess)
  ▼
route per scheme:
  NOT_ELIGIBLE → skip to FINAL (with reasons, still cited)
  ELIGIBLE / PARTIAL → VERIFICATION
  ▼
VERIFICATION (evidence retrieval + claim diff + freshness)
  │──(CONFLICT)──► CONFLICT_FLAG (attach both sources, no resolution)
  │──(STALE)──► STALE_FLAG
  ▼
DOCUMENT_DEADLINE_CHECK ("Not found in retrieved official sources" if absent)
  ▼
ACTION_PLAN (LLM prose from verified facts + template)
  ▼
FINAL_RESPONSE (schema-validated, internal state stripped)
```

### 3.3. Node Responsibilities
- **Normalize:** Coerce and validate; deterministic Python; no LLM.
- **Discovery:** Retrieve candidate schemes and rank; never emits eligibility conclusions.
- **Eligibility:** Pure functions; outputs `PASS / FAIL / MISSING_INFORMATION` per criterion; aggregates into `ELIGIBLE / PARTIALLY_ELIGIBLE / NOT_ELIGIBLE / UNDETERMINED`.
- **Verification:** For each criterion, retrieve evidence chunks and compare against structured rule value.
- **Doc/Deadline:** Query `scheme_documents` first, fall back to retrieved evidence chunks.
- **Action Plan:** Synthesize verified facts into chronological citizen action items.

**Aggregation Rule:** Any mandatory criterion `FAIL` → `NOT_ELIGIBLE`. Otherwise any `MISSING` → `PARTIALLY_ELIGIBLE`. Otherwise `ELIGIBLE`.

**LLM Output Rule:** Every LLM node uses structured output (Pydantic schema). If validation fails, retry once, then degrade gracefully to deterministic template text. Never invent information.

---

## 4. PostgreSQL & pgvector Data Model

```sql
-- Relational Models
users(id uuid PK, email, auth_provider_id, created_at)
profiles(id, user_id FK, data_encrypted bytea, schema_version, created_at)
   -- minimal demographic fields: state, age_band, annual_income_band, education, occupation, category, goal

sources(id, url UNIQUE, title, publisher, source_tier smallint,  -- 1..5 trust model
        department, state, doc_type, source_updated_at, last_verified_at,
        content_hash, verification_status)  -- VERIFIED|STALE|REQUIRES_REVIEW|CONFLICTING
schemes(id, slug, name, category, level, state, department, description, active)
scheme_sources(scheme_id FK, source_id FK, role)
scheme_criteria(id, scheme_id FK, criterion_key, operator, value jsonb,
                source_id FK, source_ref, version, effective_from)
   -- Example: ('income_annual','<=',{"v":800000}), ('occupation','IN',{"v":["farmer"]})
scheme_documents(id, scheme_id FK, kind, name, required bool, source_id FK,
                 deadline date NULL, route, apply_url)

-- Vector Store for Evidence (Separated from business rules)
document_chunks(id, source_id FK, scheme_id FK NULL, chunk_index, text,
                page_ref, section_ref, embedding vector(N), metadata jsonb,
                content_hash)   -- HNSW index on embedding

-- Output & Audit Records
eligibility_results(id, profile_id FK, scheme_id FK, status, rules_version,
                    engine_trace jsonb, created_at)
eligibility_criteria_results(id, result_id FK, criterion_id FK, status,
                             user_value_ref, evidence_chunk_id FK NULL)
verification_results(id, result_id FK, status, conflict_detail jsonb,
                     freshness_status, checked_at)
recommendations(id, profile_id FK, scheme_id FK, relevance_score, why_relevant)
action_items(id, recommendation_id FK, kind, text, document_id FK NULL,
             deadline NULL, status)
audit_logs(id, request_id, user_id NULL, event, node, payload_redacted jsonb, ts)
```

**Separation Principle:**
`scheme_criteria` stores deterministic rules in relational columns and JSONB.
`document_chunks` stores embeddings for evidence retrieval only.
**Rules are NEVER read or derived from vector similarity.**

**pgvector Indexing:** Use HNSW index with cosine distance (`vector_cosine_ops`), pre-filtering by `scheme_id`, `state`, and `doc_type` metadata.

**Conflict Detection:** Structured claims `(scheme, criterion_key, value, source, date)` extracted from evidence chunks are diffed deterministically. Disagreements trigger `CONFLICTING` status and both conflicting sources are preserved in the response.

---

## 5. RAG & Ingestion Architecture

```
seed_loader (demo)  ─┐
                     ├─► normalize → extract text (HTML/PDF) → sanitize
live_fetcher (CLI) ──┘      → chunk (section-aware, ~500 tok, 60 overlap)
                            → metadata → embed (batch) → upsert by content_hash
```

- **Retrieval Pipeline:** Metadata filter → Vector top-k (~20) → Lightweight rerank (source tier, freshness, keyword overlap) → Top 5–6 chunks passed into agent context.
- **Sanitization:** Strip scripts and hidden text, wrap in `<evidence>` blocks. The system prompt instructs the LLM that evidence is data and instructions inside it must be ignored.
- **Freshness Policy:** `last_verified_at` is stamped on ingest. Changed `content_hash` marks source as `REQUIRES_REVIEW`. Sources older than 180 days display a `STALE` indicator.
- **Live Mode:** Manual/CLI refresh in v1; automated scheduled crawler categorized as Future Scope.

---

## 6. API Contracts

### Endpoints
```
POST /api/profile             → ProfileOut {profile_id, missing_fields[]}
POST /api/discovery           {profile_id, goal} → [CandidateOut]
POST /api/eligibility         {profile_id, scheme_id} → EligibilityOut
POST /api/verification        {result_id} → VerificationOut
POST /api/action-plan         {profile_id, scheme_id} → ActionPlanOut
POST /api/analyze             Full LangGraph run (with Server-Sent Events for live progress)
GET  /api/schemes             List schemes
GET  /api/schemes/{id}        Scheme details & criteria
GET  /api/sources/{id}        Source metadata & verification history
GET  /api/health              Service health probe
```

### Core Schema: `EligibilityOut`
```json
{
  "scheme_id": "uuid",
  "status": "PARTIALLY_ELIGIBLE",
  "criteria": [
    {
      "criterion": "Income",
      "status": "PASS",
      "user_value": "₹6L band",
      "rule": "<= ₹8L",
      "evidence": [
        {
          "chunk_id": "uuid",
          "quote": "Annual household income must not exceed ₹8,00,000.",
          "source_id": "uuid"
        }
      ]
    },
    {
      "criterion": "Residence",
      "status": "MISSING_INFORMATION",
      "evidence": []
    }
  ],
  "why_this_scheme": "Aimed at small business owners seeking working capital subsidies.",
  "why_this_result": "Income criterion satisfied; state residency confirmation required.",
  "missing_information": ["residence_state"],
  "sources": [
    {
      "title": "Official Scheme Notification 2024",
      "url": "https://gov.in/schemes/notification-2024.pdf",
      "tier": 1,
      "last_verified_at": "2026-01-15T00:00:00Z",
      "status": "VERIFIED"
    }
  ],
  "disclaimer": "Evidence-grounded assessment based on available official criteria; verify on official portal."
}
```

Every scheme evaluation carries **WHAT / WHY / SOURCE / EVIDENCE / NEXT STEP** as first-class fields.

---

## 7. Security Architecture

- **Authentication:** Lightweight anonymous session tokens for instant demo access, with optional JWT credentials for account persistence.
- **Secrets Management:** Server-side environment variables only. Frontend never receives LLM keys or database passwords.
- **Rate Limiting:** IP-based rate limiting via FastAPI middleware (60 req/min).
- **PII Protection:** Demographics collected exclusively in bands (income band, age band). Profiles encrypted with AES-GCM prior to storage. No Aadhaar, phone, or bank details collected.
- **Audit Logging:** Structured JSON with `request_id`, recording node name, execution duration, and evaluation status, with user profile payloads redacted.
- **Prompt Injection Defense:** Strict XML evidence delimitation, structured Pydantic outputs, and zero tool execution capabilities given to the LLM.

---

## 8. Frontend Information Architecture

```
/                  Landing Page (Value prop, how it works, featured schemes)
/login, /signup    Authentication with instant "Guest Demo Entry" bypass
/profile           Step-by-step demographic onboarding form
/schemes           Scheme discovery cards with relevance filters & status chips
/schemes/[id]      Detailed evaluation: StatusBadge, CriteriaTable, EvidenceDrawer, ActionPlan
/sources           Official Source Registry with freshness & verification timestamps
```

---

## 9. Error and Fallback Matrix

| Failure Mode | System Behavior |
|---|---|
| **No candidates or sources found** | Returns `"No reliable official source found."` with zero fabricated recommendations. |
| **Missing profile fields** | Returns `MISSING_INFORMATION` with targeted questionnaire; no speculative scoring. |
| **Conflicting official sources** | Displays `CONFLICT DETECTED` banner with both sources, dates, and differing values; no silent resolution. |
| **Stale source (> 180 days)** | Displays result with prominent `STALE SOURCE` indicator and last-verified date. |
| **LLM gateway failure / timeout** | Deterministic rules and citations still render; LLM prose replaced with deterministic template text. |
| **Rule engine exception** | Returns `UNDETERMINED` status; never guesses or estimates outcome. |
| **Database / embedding failure** | Returns clean API error response; zero fabricated mock outputs. |

---

## 10. Demo & Evaluation Strategy

- **Seed Dataset (`seed/schemes.yaml`):** 5–6 curated schemes across Agriculture, Education, Healthcare, Housing, and Small Enterprise.
- **Source Snapshots (`seed/sources/`):** Pre-downloaded, chunked, and embedded official notifications to guarantee demo reliability without external network dependency.
- **Seeded Scenarios:**
  - One intentional conflict scenario to showcase transparent conflict detection.
  - One intentional stale source scenario to showcase automated freshness warnings.
- **Persona Profiles:** 3 pre-configured demo personas (e.g. Small Farmer, Post-Matric Student, Urban Artisan) for smooth evaluation walkthroughs.

---

## 11. Open Technical Decisions & Recommended Defaults

| Decision | Claude Architecture Note | Recommended Default for PolicyPilot | Status |
|---|---|---|---|
| **1. LLM & Embedding Provider** | Anthropic or alternative; determines embedding dimension | **Gemini 1.5/Flash via Google GenAI SDK** for fast LLM generation + `text-embedding-004` (768 dimensions). High speed and generous quota. | Documented for User Review |
| **2. Geographic Scope** | Central only vs Central + 1 State | **Central Schemes + 1 State (e.g. Telangana)**. Enables state-level conflict and eligibility filtering demonstration. | Recommended |
| **3. Authentication Mode** | Real auth vs Anonymous session | **Anonymous Guest Session by default** + dedicated `/login` & `/signup` routes for demonstration. Avoids blocking judges. | Recommended |
| **4. Scheme Selection (5–6)** | Which schemes and who verifies | Curated list from official Central/State portals: PM-Kisan, PM-JAY, PMAY-G, NSP Post-Matric, PM-Vishwakarma. | Curated in Phase 1 Seed |
| **5. Language Support** | English only vs Multilingual | **English for MVP v1**; Multilingual pipeline clearly marked as Future Scope. | Recommended |
| **6. Deployment Target** | Docker Compose vs Hosted Cloud | **Hosted Web (Vercel) + API (Render) + Supabase (Postgres+pgvector)**, with local native execution fully supported. | Documented |
