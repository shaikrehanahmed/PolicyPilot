# PolicyPilot — Environment Configurations

This document specifies the four runtime environments for PolicyPilot: **LOCAL**, **DEVELOPMENT**, **DEMO**, and **PRODUCTION**.

> **SECURITY MANDATE:** Never commit real secrets, database passwords, or API keys into this file or repository. Use `.env.example` as a template and provide real values securely via environment injection.

---

## 1. Environments Overview

| Dimension | LOCAL | DEVELOPMENT | DEMO | PRODUCTION |
|---|---|---|---|---|
| **Purpose** | Local feature coding & unit tests | Continuous Integration / Preview | Evaluator & Live Stage Presentation | Full production deployment |
| **Frontend URL** | `http://localhost:3000` | `https://dev.policypilot.app` | `https://demo.policypilot.app` | `https://policypilot.app` |
| **API URL** | `http://localhost:8000` | `https://api-dev.policypilot.app` | `https://api-demo.policypilot.app` | `https://api.policypilot.app` |
| **Database** | Local Postgres or Dev Cloud DB | Cloud PostgreSQL (Dev instance) | Managed PostgreSQL (Pre-seeded) | Managed HA PostgreSQL + pgvector |
| **Data Mode** | `DEMO_MODE=true` or live | Hybrid | `DEMO_MODE=true` (Pre-cached snapshots) | Live refresh workers active |
| **LLM Provider** | Mock / Gemini / Anthropic Dev | Shared Dev API Key | Dedicated High-Quota Key | Production Quota Key |
| **Auth Mode** | Anonymous sessions | Anonymous + Test JWT | Anonymous Demo + Test Accounts | Managed Auth / Secure JWT |
| **Log Level** | `DEBUG` | `INFO` | `INFO` | `WARNING` |

---

## 2. Environment Variables Specification

### 2.1. Backend Variables (`services/api/.env`)

| Variable | Description | Required? | Example Value |
|---|---|---|---|
| `ENVIRONMENT` | Runtime environment name | Yes | `local` / `demo` / `production` |
| `DEBUG` | Enable debug mode and docs | Yes | `true` (local), `false` (prod) |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql+asyncpg://user:pass@host:5432/policypilot` |
| `APP_SECRET_KEY` | Symmetric key for profile encryption & tokens | Yes | *Generated 32-byte hex string* |
| `LLM_PROVIDER` | Active LLM Gateway provider | Yes | `gemini` or `anthropic` |
| `GOOGLE_API_KEY` | Gemini API Key | Conditional | *Secret Key* |
| `ANTHROPIC_API_KEY`| Anthropic API Key | Conditional | *Secret Key* |
| `EMBEDDING_MODEL` | Vector embedding model name | Yes | `text-embedding-004` (768d) |
| `EMBEDDING_DIM` | Vector dimension size | Yes | `768` |
| `DEMO_MODE` | Use pre-cached verified source snapshots | Yes | `true` for demo and local |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | Yes | `http://localhost:3000,https://policypilot.app` |
| `RATE_LIMIT_PER_MINUTE` | Per-client request cap | No | `60` |

### 2.2. Frontend Variables (`apps/web/.env.local`)

| Variable | Description | Required? | Example Value |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of PolicyPilot Backend API | Yes | `http://localhost:8000` |
| `NEXT_PUBLIC_APP_ENV` | Application environment label | Yes | `demo` |
| `NEXT_PUBLIC_DEMO_MODE`| Display demo helper chips & badges | Yes | `true` |

---

## 3. Demo Mode Specifics (`DEMO_MODE=true`)

During hackathon judging and live demonstrations, network scraping of external government portals can fail due to rate limits, anti-bot CAPTCHAs, or downtime.

When `DEMO_MODE=true`:
1. **Cached Source Snapshots:** The system serves pre-ingested, officially verified snapshots from `seed/sources/`.
2. **Intentional Conflict Scenario:** The database includes one pre-configured conflicting scenario (e.g. State portal guideline with ₹6L threshold vs. Central Gazette with ₹8L threshold) to demonstrate conflict detection and transparent dual citation.
3. **Intentional Stale Scenario:** The database includes one source snapshot marked as verified > 180 days ago to showcase the automated `STALE` warning banner.
4. **Instant Persona Profiles:** Pre-loaded demographic profiles (e.g., Small Farmer, Student, Artisan) are available for rapid evaluation walkthroughs.
