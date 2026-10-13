# PolicyPilot — Backend API & Deterministic Rule Engine

This service hosts the FastAPI backend, pure Python deterministic eligibility rule engine, local demo repository, LangGraph agentic workflow pipeline, and PostgreSQL/pgvector database models.

---

## 🚀 Running the API

### 1. In Demo Mode (Zero Credentials Required)
Demo mode runs purely in-memory using audited seed schemes and does not require PostgreSQL, pgvector, or external API keys:
```powershell
cd services\api
.\.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Probe: `http://localhost:8000/api/health`

### 2. In Production Database Mode (With PostgreSQL & pgvector)
When a live PostgreSQL instance with the `vector` extension is running:
```powershell
# Set database connection string in .env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/policypilot
DEMO_MODE=false

# Run migrations
alembic upgrade head

# Seed database
python -m app.db.seed_loader --seed-file ../../seed/schemes.yaml
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, demo mode status, DB readiness, LLM model info |
| `GET` | `/api/v1/schemes` | List verified government schemes (optional category/state filters) |
| `GET` | `/api/v1/schemes/{id_or_slug}` | Detailed scheme profile with criteria, required documents & sources |
| `POST` | `/api/v1/schemes/discover` | Match and rank schemes against citizen profile demographics |
| `POST` | `/api/v1/profile/validate` | Validate and normalize citizen demographic inputs and state codes |
| `POST` | `/api/v1/eligibility/evaluate` | Deterministic criterion-by-criterion rule evaluation for a scheme |
| `POST` | `/api/v1/eligibility/evaluate-batch` | Batch evaluate citizen eligibility across multiple schemes |
| `GET` | `/api/v1/sources` | Official government sources, publishers, and trust tiers |
| `GET` | `/api/v1/sources/status` | Source freshness and verification statuses |
| `GET` | `/api/v1/sources/evidence` | Lexical and semantic Gazette excerpt quote search |
| `POST` | `/api/v1/action-plans/generate` | Generate personalized step-by-step roadmap and doc checklist |
| `POST` | `/api/v1/workflow/run` | Execute 7-node LangGraph agentic workflow with conditional fallback |

---

## 🧪 Testing and Quality Assurance

### Run Test Suite
```powershell
.\.venv\Scripts\pytest.exe -v
```
All **34 tests pass** with **79% code coverage**.

### Linting & Type Checking
```powershell
# Ruff Linting (0 errors)
.\.venv\Scripts\ruff.exe check .

# Mypy Type Checking (0 errors across 29 source files)
.\.venv\Scripts\mypy.exe --explicit-package-bases app
```

### End-to-End Synthetic Journey Verification
```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_api_endpoints.py -k test_langgraph_workflow
```
Validates the entire citizen journey: profile validation → scheme discovery → rule evaluation → evidence search → action plan → LangGraph execution.
