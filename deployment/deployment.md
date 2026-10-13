# PolicyPilot — Deployment Architecture & Operations

This document outlines the deployment strategy, service startup sequences, hosting topologies, and operational procedures for PolicyPilot.

---

## 1. Architectural Deployment Model

PolicyPilot is built as a **Modular Monolith** designed for high reliability, minimal operational friction, and instant auditability by evaluators.

```
┌────────────────────────────────────────────────────────┐
│ PUBLIC INTERNET / CLIENT BROWSER                       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼────────────────────────────┐
│ WEB PRESENTATION TIER (Next.js 15+ on Vercel / Node)   │
│ - SSR & Static Assets                                  │
│ - Interactive UI (Profile, Discovery, Evidence, Plan)  │
│ - Client calls /api on backend via reverse proxy or env│
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST / SSE
┌───────────────────────────▼────────────────────────────┐
│ BACKEND APPLICATION SERVICE (FastAPI on Render / Cloud)│
│ - API Routers (/profile, /discovery, /eligibility, etc)│
│ - Pure Python Deterministic Eligibility Rule Engine    │
│ - LangGraph Orchestrator (Typed PolicyState)           │
│ - LLM Gateway (Gemini API / Anthropic with timeouts)   │
└─────────────┬────────────────────────────┬─────────────┘
              │ Relational (SQLAlchemy)    │ Vector Cosine
              ▼                            ▼
┌────────────────────────────────────────────────────────┐
│ PERSISTENCE TIER (PostgreSQL 16 + pgvector on Supabase)│
│ - Relational Tables: schemes, criteria, sources, audit │
│ - Vector Store: document_chunks with HNSW index        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Deployment Plan

### 2.1. Persistence Tier (PostgreSQL + pgvector)
- **Primary Option for Hackathon / Cloud:** Managed PostgreSQL on Supabase or Neon.
  - Native `pgvector` extension support.
  - Zero local host Docker dependency.
  - Automatic connection pooling and SSL encryption.
- **Local Dev Option:** PostgreSQL 16 container with `pgvector/pgvector` image or local PostgreSQL service.

### 2.2. Backend Application Service (FastAPI)
- **Target Platform:** Render, Railway, Google Cloud Run, or AWS App Runner.
- **Runtime:** Python 3.12+ container using `Dockerfile` or native Python buildpack.
- **Startup Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --timeout-keep-alive 60
  ```
- **Concurrency & Scaling:** 2 workers per instance; asynchronous I/O with connection pool sizing (default: 10 connections).

### 2.3. Frontend Presentation Service (Next.js)
- **Target Platform:** Vercel or Node.js Docker container.
- **Configuration:** Set `NEXT_PUBLIC_API_URL` pointing to the deployed backend service URL.
- **Build Output:** Standalone Next.js production bundle.

---

## 3. Strict Service Startup Order

To prevent startup races or uninitialized database schemas, services must start in strict order:

1. **Step 1: Database Provisioning & Health**
   - PostgreSQL service starts and establishes ready state.
   - Run SQL command: `CREATE EXTENSION IF NOT EXISTS vector;`
2. **Step 2: Database Migrations**
   - Execute: `alembic upgrade head`
   - Confirms all tables (`schemes`, `scheme_criteria`, `document_chunks`, `sources`, etc.) are up to date.
3. **Step 3: Seed Data Loading**
   - Execute: `python -m app.db.seed_loader --seed-file ../../seed/schemes.yaml`
   - Populates verified schemes, rules, and vector embeddings for the demo.
4. **Step 4: Backend API Launch**
   - Start FastAPI with health check probing `/api/health`.
   - Ensure CORS settings permit frontend origin.
5. **Step 5: Frontend Web Launch**
   - Start Next.js web application.
   - Verify initial page load and connectivity to `/api/health`.

---

## 4. Health Checks & Observability

### 4.1. Liveness Probe: `GET /api/health`
Returns 200 OK if service process is running:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "pgvector": "available"
}
```

### 4.2. Readiness Probe: `GET /api/ready`
Performs active queries against PostgreSQL and pgvector to verify:
- Connection pool active.
- Scheme table contains loaded seed records.
- Vector distance operator `<=>` functional.

---

## 5. Security & Production Considerations

1. **Secrets Management:**
   - No API keys or database passwords committed to Git.
   - In production, inject secrets via environment management (Vercel Project Settings, Render Environment Variables).
2. **CORS Policy:**
   - Configure `ALLOWED_ORIGINS` explicitly to match the frontend domain in production.
3. **Rate Limiting:**
   - In-memory rate limiting via `slowapi` or FastAPI middleware (e.g. 60 requests/minute per client IP).
4. **PII Protection:**
   - Collect demographic bands (e.g., Annual Income Band: ₹2.5L–₹5L, Age Band: 18–25) rather than exact personal data.
   - Do NOT collect Aadhaar numbers, phone numbers, or residential street addresses for the prototype.
   - Encrypt profile records using AES-GCM app-level encryption before persistence.
5. **LLM Failure Resilience:**
   - If the LLM gateway times out or fails, the API gracefully returns deterministic rule results and citations with templated fallback prose. The system never crashes or guesses.
