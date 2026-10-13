# PolicyPilot — Rollback & Disaster Recovery Playbook

This document details procedures for identifying bad deployments, halting releases, rolling back frontend/backend services, handling database migration reversions, and verifying recovery.

---

## 1. Bad Deployment Triggers

Initiate a rollback immediately if any of the following occur during or after a release:

1. **Service Unavailability:** `GET /api/health` returns non-200 or times out for > 60 seconds.
2. **Database Failure:** Connection pool exhaustion or syntax errors executing vector search queries (`<=>`).
3. **Core Engine Failure:** The deterministic rule engine raises unhandled exceptions resulting in pervasive `UNDETERMINED` statuses across valid test profiles.
4. **Build / SSR Crash:** Next.js throws fatal hydration or rendering exceptions on the `/` or `/schemes/[id]` routes.
5. **Security / Secret Breach:** Accidental exposure of API keys, private tokens, or unencrypted profile data.

---

## 2. Emergency Release Halt Procedure

1. **Notify Team Axiom:** Alert Team Lead Mariya Fatima and engineering team.
2. **Freeze Git Branch:** Stop all active pull requests or pushes to `main`.
3. **Switch Traffic / Demo Fallback:** If using a hosting platform (e.g. Vercel, Render), instantly point custom domains or staging traffic to the previous stable release hash.

---

## 3. Frontend Rollback (`apps/web`)

### Vercel / Cloud Platform
1. Navigate to the **Deployments** tab in the hosting dashboard.
2. Identify the last known good deployment tag.
3. Click **Instant Rollback** to promote the previous build to production.
4. Verify edge caching clears within 60 seconds.

### Self-Hosted / Docker
1. Pull the previous verified container image:
   ```bash
   docker stop policypilot-web
   docker run -d --name policypilot-web -p 3000:3000 policypilot-web:stable-tag
   ```

---

## 4. Backend Rollback (`services/api`)

### Render / Railway / PaaS
1. Re-deploy the previous commit SHA or rollback to the prior release artifact.
2. Confirm the environment variable overrides remain intact.
3. Check application logs for clean startup within 30 seconds.

### Local / Native Process Rollback
1. Stop running uvicorn process (`Ctrl+C` or kill process ID).
2. Checkout previous stable commit:
   ```bash
   git checkout <last-good-commit> services/api
   ```
3. Restart backend service:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

---

## 5. Database Migration Precautions & Rollback

> **Caution:** Rolling back database schemas can risk data loss if destructive changes (such as column drops) were executed. Always verify backward compatibility before writing migrations.

### Reverting Alembic Migrations
1. Check current migration revision:
   ```bash
   alembic current
   ```
2. Roll back one revision:
   ```bash
   alembic downgrade -1
   ```
   Or roll back to a specific known stable revision:
   ```bash
   alembic downgrade <target_revision_hash>
   ```

### Precautionary Schema Rules
- Never drop a column in the same migration that introduces new code; deprecate in code first.
- Always provide both `upgrade()` and `downgrade()` methods in every Alembic migration script.

---

## 6. Seed & Vector Data Rollback

If seed data corruption or unverified criteria was ingested:
1. Truncate seed tables in dev/demo:
   ```sql
   TRUNCATE TABLE scheme_criteria, scheme_documents, scheme_sources, document_chunks CASCADE;
   ```
2. Re-load from verified baseline seed file:
   ```bash
   python -m app.db.seed_loader --seed-file ../../seed/schemes.yaml --clean
   ```

---

## 7. Recovery Verification Checklist

Following rollback completion, execute this sequence to certify system stability:

1. [ ] `curl http://localhost:8000/api/health` returns `200 OK` with database connected.
2. [ ] Test profile evaluation endpoint returns `ELIGIBLE` or `NOT_ELIGIBLE` with expected criteria breakdown.
3. [ ] Load web frontend in private browser window and verify landing page and scheme cards render without error.
4. [ ] Confirm no secrets or error traces are exposed in client console.
