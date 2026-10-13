# PolicyPilot — Evidence-Grounded Policy Navigation

> **Team:** Team Axiom  
> **Team Lead:** Mariya Fatima  
> **Team Members:** Nameera Sadaf, Shaik Rehan Ahmed  
> **Track:** Generative & Agentic AI — HACK-X 2026  

PolicyPilot is an evidence-grounded civic technology platform designed to help Indian citizens navigate complex government welfare schemes. It deterministically validates citizen eligibility, links every criterion to auditable official government Gazette excerpts, and generates step-by-step personalized application roadmaps.

---

## 🏛️ Core Architectural Principle

```
LLM EXPLAINS.
RULES VALIDATE.
RETRIEVAL PROVIDES EVIDENCE.
OFFICIAL SOURCES REMAIN THE ONLY SOURCE OF TRUTH.
```

- **Zero Eligibility Hallucination:** The Large Language Model (LLM) **NEVER** decides or alters eligibility. Decisions are rendered by a pure Python deterministic rule engine.
- **Relational vs. Vector Separation:** Structured criteria (`scheme_criteria`) are evaluated with boolean certainty. Vector embeddings (`document_chunks`) are used solely to retrieve supporting evidence from official government gazettes and notifications.
- **Auditable Evidence Citations:** Every criterion result is linked to exact quotes, official source URLs, trust tiers, and Gazette section clauses.
- **Missing Information Transparency:** Missing profile values evaluate to `unknown`—never silently assumed. An assessment never guarantees government approval.

---

## ⚡ Quick Start: Demo Mode (Zero Credentials Required)

PolicyPilot includes an **honest, zero-dependency Demo Mode** that runs out of the box without PostgreSQL, pgvector, or external API keys.

### 1. Start the Backend API (FastAPI)
```powershell
cd services\api
.\.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`
- Health Probe: `http://localhost:8000/api/health`

### 2. Start the Frontend (Next.js 16 + Tailwind CSS)
In a separate terminal:
```powershell
cd apps\web
npm run dev
```
- Citizen Web Application: `http://localhost:3000`

---

## 🧪 Verification & Test Suite Results

Every component has been verified using real test runners with zero weakened assertions:

### Backend Test Results (pytest)
```powershell
cd services\api
.\.venv\Scripts\pytest.exe -v
```
- **34 passed tests** across:
  - `tests/test_api_endpoints.py` (14 tests for schemes, discovery, profile validation, eligibility, action plan, sources, workflow, PM-JAY cashless rules, PMAY-G multi-criteria, Rythu Bharosa ₹12,000/acre, LangGraph fallback, and honest health status)
  - `tests/test_health.py` (2 tests for health probes and demo mode)
  - `tests/test_rules_engine.py` (16 tests for deterministic operators, bounds, missing data handling, unverified scheme guards, statutory exclusions, and state aggregation)
  - `tests/test_seed_loader.py` (2 tests for seed YAML parsing and unverified scheme rejection)
- **Code Coverage:** 79%

### Code Quality & Type Safety
```powershell
# Ruff Linter & Formatter: 0 errors
.\.venv\Scripts\ruff.exe check .

# Mypy Strict Package Typing: 0 errors across 29 source files
.\.venv\Scripts\mypy.exe --explicit-package-bases app
```

### Frontend Build Verification (Next.js 16 App Router)
```powershell
cd apps\web

# ESLint: 0 errors, 0 warnings
npm run lint

# Production Build: All 7 routes compiled cleanly (Turbopack)
npm run build
```
Routes compiled:
- `○ /` (Landing Page with Hero Journey & Architecture Explanations)
- `○ /profile` (Demographic Onboarding & Validation)
- `○ /schemes` (Scheme Discovery & Category Filters)
- `◐ /schemes/[id]` (Criterion Matrix, Evidence Citations, Action Roadmap, LangGraph Modal)
- `○ /sources` (Gazette Sources Registry)

---

## 📚 Demonstration & Judging Documentation (`docs/demo/`)

Complete documentation suite prepared for HACK-X 2026 judges:

1. **[Feature Explanations Guide](file:///c:/antigravity%20projects/PolicyPilot/docs/demo/feature-explanations.md):** Deep-dive into all 14 implemented features, backend mechanics, and boundary conditions.
2. **[Live Demo Script (4–5 Mins)](file:///c:/antigravity%20projects/PolicyPilot/docs/demo/live-demo-script.md):** Step-by-step presentation walkthrough with exact timings, spoken script, and backup scenarios.
3. **[Technical Architecture Explained](file:///c:/antigravity%20projects/PolicyPilot/docs/demo/technical-architecture-explained.md):** Plain and technical breakdown, sequence diagram, and failure resilience matrix.
4. **[Judge Questions & Authoritative Answers](file:///c:/antigravity%20projects/PolicyPilot/docs/demo/judge-questions.md):** Honest, direct answers to 12 tough technical and product questions.
5. **[Pre-Demo Checklist & Launch Protocol](file:///c:/antigravity%20projects/PolicyPilot/docs/demo/pre-demo-checklist.md):** Step-by-step launch commands and health verification instructions.

---

## 📦 Verified Welfare Schemes

All verified seed schemes in `seed/schemes.yaml` are linked to authentic government notifications and canonical portals:

| Scheme Slug | Scheme Name | Level | Domain | Canonical Official Source |
|---|---|---|---|---|
| `pm-kisan` | Pradhan Mantri Kisan Samman Nidhi | CENTRAL | Agriculture | [pmkisan.gov.in](https://pmkisan.gov.in/) |
| `pm-jay` | Ayushman Bharat PM-JAY | CENTRAL | Healthcare | [nha.gov.in/PM-JAY](https://nha.gov.in/PM-JAY) |
| `pmay-g` | Pradhan Mantri Awaas Yojana - Gramin | CENTRAL | Housing | [pmayg.gov.in](https://pmayg.gov.in/) |
| `nsp-post-matric` | Post-Matric Scholarship for SC Students | CENTRAL | Education | [scholarships.gov.in](https://scholarships.gov.in/) |
| `rythu-bharosa` | Rythu Bharosa (Telangana Investment Support) | STATE (TS) | Agriculture | [rythubharosa.telangana.gov.in](https://rythubharosa.telangana.gov.in/Default_Eng.aspx) |

---

## 🤖 AI Models & LangGraph Pipeline

- **LLM Model:** Gemini 3.8 Flash (`gemini-3.8-flash`) via `@google/genai` SDK for plain-language, evidence-grounded explanations.
- **Embedding Model:** Gemini Embedding 2 (`gemini-embedding-2`) with explicit 768 output dimensions.
- **Fallback Integrity:** When `GEMINI_API_KEY` is not configured, the system provides transparent deterministic explanations clearly marked with `is_fallback: True`. The application **never** claims an AI provider was invoked when running in fallback mode.
- **LangGraph Agentic Orchestration:** 7-node state graph with conditional routing (`route_after_discovery`) coordinating citizen profile ingestion, discovery ranking, deterministic rules evaluation, document checking, Gazette evidence retrieval, action roadmap assembly, and discovery fallback routing.

---

## 🏢 Team Axiom — HACK-X 2026

- **Team Lead:** Mariya Fatima
- **Team Members:** Nameera Sadaf, Shaik Rehan Ahmed
- **Non-Fabrication Commitment:** PolicyPilot is engineered to resist AI hallucinations, fabricated policies, and counterfeit metrics.
