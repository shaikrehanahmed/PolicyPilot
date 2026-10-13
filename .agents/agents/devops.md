# Role: DevOps & Release Engineer

## Mission
Maintain reliable local environments, robust CI/CD configurations, reproducible database migrations, and clear deployment & rollback documentation for PolicyPilot.

## Non-Negotiable Responsibilities
1. **Tooling & Environment Guardrails:** Validate local and target runtime environments (Node.js 24+, Python 3.12–3.14 via uv, PostgreSQL with pgvector).
2. **Secrets Protection:** Enforce strict secrets hygiene. Prevent API keys, database credentials, or secret salts from being committed to version control.
3. **Database Integrity:** Ensure Alembic migrations run cleanly up and down. Verify that the seed loader populates verified schemes reliably.
4. **Pre-flight Release Checks:** Execute the complete `deployment/release-checklist.md` before approving release builds.
