# PolicyPilot — Build & Setup Guide

This document details all prerequisites, build commands, database migrations, and validation procedures required to build and run PolicyPilot locally and in production environments.

---

## 1. System Prerequisites

The following host toolchains are required:

| Tool | Recommended Version | Detected Host Environment | Notes |
|---|---|---|---|
| **Node.js** | `>= 20.x` (LTS or current) | `v24.13.1` | Required for Next.js 15+ frontend |
| **npm** | `>= 10.x` | `11.8.0` | Default package manager for frontend |
| **Python** | `3.11` to `3.14` | `Python 3.14.2` | Core backend runtime |
| **uv** (recommended) | `>= 0.4.x` | `uv 0.12.17` | High-speed Python package/environment manager |
| **Git** | `>= 2.x` | `git 2.55.0` | Version control |
| **PostgreSQL** | `>= 15.x` | External / Docker / Cloud | Must have `pgvector` extension installed |
| **Docker** (optional) | `>= 24.x` | *Not in PATH on Windows host* | Optional; native execution with cloud/local DB supported |

> **Host Tooling Note:** On the current Windows development machine, Python 3.14, Node v24, and `uv` are installed directly in PATH. Docker CLI is not detected in PATH. Therefore, both native execution and containerized execution are fully documented below.

---

## 2. Repository Layout

```
policypilot/
├── apps/
│   └── web/                 # Next.js (TypeScript, Tailwind, shadcn/ui)
├── services/
│   └── api/                 # FastAPI (Python, LangGraph, Pydantic, SQLAlchemy)
├── seed/                    # YAML seed schemes and cached official source documents
├── deployment/              # Deployment and release specifications
└── docs/                    # Architecture and design specifications
```

---

## 3. Database Setup (PostgreSQL with pgvector)

PolicyPilot requires PostgreSQL with the `vector` extension enabled.

### Option A: Cloud Managed PostgreSQL (e.g. Supabase / Neon / AWS RDS)
1. Provision a PostgreSQL 15+ instance.
2. Ensure the `pgvector` extension is active:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
3. Set your connection string in `services/api/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<dbname>
   ```

### Option B: Local Docker (when Docker is available)
Run the bundled postgres service with pgvector:
```bash
docker run -d --name policypilot-db \
  -e POSTGRES_USER=policypilot \
  -e POSTGRES_PASSWORD=policypilot_dev_pass \
  -e POSTGRES_DB=policypilot \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

---

## 4. Backend Setup & Build (`services/api`)

### 4.1. Virtual Environment & Dependencies
Using `uv` (recommended):
```bash
cd services/api
uv venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

uv pip install -e ".[dev]"
```

Using standard `pip`:
```bash
cd services/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4.2. Environment Configuration
Copy the template and configure local settings:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL`, `SECRET_KEY`, and LLM API keys (`GOOGLE_API_KEY` or `ANTHROPIC_API_KEY`) are defined.

### 4.3. Database Migrations (Alembic)
Apply relational schema migrations:
```bash
alembic upgrade head
```

### 4.4. Seed Data Ingestion
Load the 5–6 verified official schemes and cached source chunks:
```bash
python -m app.db.seed_loader --seed-file ../../seed/schemes.yaml
```

### 4.5. Running the Backend Dev Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI will be accessible at: `http://localhost:8000/docs`

---

## 5. Frontend Setup & Build (`apps/web`)

### 5.1. Dependency Installation
```bash
cd apps/web
npm install
```

### 5.2. Environment Configuration
Copy the frontend environment template:
```bash
cp .env.example .env.local
```
Set the API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5.3. Running the Frontend Dev Server
```bash
npm run dev
```
The web application will be accessible at: `http://localhost:3000`

### 5.4. Production Build
```bash
npm run build
```
This generates the optimized standalone Next.js production bundle.

---

## 6. Full Test & Validation Commands

Execute all validation suites before creating release builds:

### Backend Validation
```bash
cd services/api

# 1. Run deterministic rule engine & graph unit tests
pytest tests/ -v

# 2. Run type checking
mypy app/

# 3. Check code formatting & linting
ruff check app/
```

### Frontend Validation
```bash
cd apps/web

# 1. TypeScript compilation check
npm run type-check

# 2. Next.js linter check
npm run lint

# 3. Frontend unit tests (if configured)
npm run test
```

### End-to-End Health Verification
Verify backend health and database connectivity:
```bash
curl http://localhost:8000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "pgvector": "available",
  "version": "1.0.0"
}
```
