# PolicyPilot — Phase-by-Phase Implementation Roadmap

This roadmap defines the implementation schedule, detailed deliverables, dependencies, and acceptance criteria across all 5 phases of PolicyPilot.

---

## Roadmap Overview

```
Phase 1: Foundation          [CURRENT MILESTONE - SETUP READY]
  ├── Relational Schema & Alembic Migrations
  ├── Seed Data Loader (5–6 Verified Schemes)
  └── Pure Python Deterministic Eligibility Rule Engine & Tests
       │
       ▼
Phase 2: Knowledge Engine
  ├── Ingestion & Sanitization Pipeline
  ├── Section-Aware Chunking & Content Hashing
  └── Vector Embeddings & pgvector HNSW Retrieval
       │
       ▼
Phase 3: AI Orchestration (LangGraph)
  ├── Typed PolicyState Graph & Conditional Branching
  ├── Semantic Discovery & Candidate Ranking
  ├── Verification & Conflict/Stale Detection Nodes
  └── Action Plan Synthesis & SSE Progress Streaming
       │
       ▼
Phase 4: Frontend Experience (Next.js)
  ├── Design System Setup (Tokens, shadcn/ui, Layout Shell)
  ├── Public Landing Page & Guest Demo Flow
  ├── Step-by-Step Demographic Profile Onboarding
  └── Scheme Detail: StatusBadge, CriteriaTable, EvidenceDrawer, ActionPlan
       │
       ▼
Phase 5: QA, Demos & Release Gate
  ├── End-to-End Automated Test Verification
  ├── Intentional Conflict & Stale Source Live Scenarios
  ├── Deployment Verification & Health Checks
  └── Evaluator Walkthrough Artifact
```

---

## Phase Details & Deliverables

### Phase 1: Foundation (Database, Seed & Deterministic Rules)
- **Goals:** Establish reproducible persistence and build the core deterministic eligibility engine.
- **Key Deliverables:**
  - Database models (`users`, `profiles`, `schemes`, `scheme_criteria`, `scheme_documents`, `sources`, `document_chunks`).
  - Alembic migrations setup and initial migration script.
  - Curated seed definition (`seed/schemes.yaml`) containing 5–6 verified Indian welfare schemes (e.g. PM-Kisan, PM-JAY, PMAY-G, NSP Post-Matric, PM Vishwakarma).
  - Seed loader script (`app.db.seed_loader`).
  - Pure Python deterministic rule evaluator (`app.rules.evaluator`) supporting operators (`<=`, `>=`, `==`, `!=`, `IN`, `RANGE`).
  - Comprehensive unit test suite (`tests/test_rules_engine.py`) covering all operators, missing profile fields, and edge cases.
- **Acceptance Gate:**
  - 100% of unit tests pass for the rule engine.
  - Zero LLM involvement in rule evaluation.
  - Seed loader populates database with verified criteria and zero synthetic hallucinations.

---

### Phase 2: Knowledge (Ingestion, Chunking, pgvector & Retrieval)
- **Goals:** Build the reliable evidence foundation with semantic search and strict citation traceability.
- **Key Deliverables:**
  - Ingestion pipeline (`app.ingestion.pipeline`) handling HTML/PDF extraction.
  - Content sanitization module stripping scripts and malicious tokens.
  - Section-aware chunking (~500 tokens, 60-token overlap) with content hashing.
  - Embedding pipeline with batch vector generation.
  - PostgreSQL pgvector HNSW indexing and metadata-filtered cosine similarity search.
  - Evidence retrieval service returning structured citations (quote, source ID, tier, URL, verified date).
- **Acceptance Gate:**
  - Given a search query or scheme ID, retrieval returns relevant official document chunks.
  - Ingestion calculates and stores content hashes for freshness tracking.
  - Chunks are stored strictly as evidence data, separate from relational rule definitions.

---

### Phase 3: AI Orchestration (LangGraph & Agent Nodes)
- **Goals:** Implement the typed state graph governing citizen journey orchestration.
- **Key Deliverables:**
  - LangGraph state definition (`PolicyState`) with Pydantic type safety.
  - Node implementations:
    - `profile_normalize_node`
    - `discovery_node` (RAG + candidate ranking)
    - `eligibility_engine_node` (Calls Phase 1 pure Python engine)
    - `verification_node` (Cross-references claims, checks freshness, flags conflicts)
    - `document_deadline_node`
    - `action_plan_node` (Synthesizes verified steps via Pydantic structured output)
  - Conditional branching routing for missing profile data, rule engine errors, and conflicts.
  - Server-Sent Events (SSE) streaming endpoint (`POST /api/analyze`) streaming real-time stage transitions.
- **Acceptance Gate:**
  - Graph executes end-to-end on test persona profiles.
  - Engine exceptions degrade cleanly to `UNDETERMINED`.
  - Conflicting sources trigger `CONFLICT DETECTED` flags without guessing.

---

### Phase 4: Frontend Experience (Next.js & Design System)
- **Goals:** Deliver the high-fidelity, responsive civic-tech interface specified in the UI/UX spec.
- **Key Deliverables:**
  - Next.js 15+ App Router setup with Tailwind CSS and `#F7F8FC` design tokens.
  - Accessible component system based on `shadcn/ui` primitives.
  - Public Landing Page (`/`) featuring hero journey visual and seed scheme cards.
  - Fast Guest Demo bypass on `/login` and `/signup`.
  - Demographic Profile Wizard (`/profile`) using income and age bands.
  - Scheme Discovery (`/schemes`) with filters and freshness indicators.
  - Scheme Detail (`/schemes/[id]`) with Status Badge, Criteria Table, Evidence Drawer, and Action Plan.
  - Visual review artifacts captured in `docs/design/screenshots/`.
- **Acceptance Gate:**
  - All screens match UI/UX specification.
  - Responsive layout verified on desktop (1440px), tablet (768px), and mobile (390px).
  - No inert buttons, placeholder copy, or fake stats.

---

### Phase 5: QA, Demos & Release Verification
- **Goals:** End-to-end audit, live demonstration scenario validation, and production packaging.
- **Key Deliverables:**
  - Intentional conflict scenario verified and easily demonstrated.
  - Intentional stale source scenario verified with warning banner.
  - Complete `deployment/release-checklist.md` execution.
  - Deployment health and readiness checks verified.
  - Final project demo report and evaluation guide.
- **Acceptance Gate:**
  - Full release checklist marked verified.
  - Zero secrets committed.
  - Ready for evaluator presentation.
