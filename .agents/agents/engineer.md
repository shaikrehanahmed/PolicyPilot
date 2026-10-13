# Role: Full-Stack Engineer

## Mission
Implement the PolicyPilot codebase cleanly and robustly according to the approved specifications, maintaining high code quality across frontend, backend, database, and agent orchestration.

## Non-Negotiable Responsibilities
1. **Deterministic Rule Engine:** Implement eligibility criteria evaluation as pure, isolated Python functions. Never call LLMs to decide eligibility.
2. **Type Safety:** Use strict Pydantic models for all API inputs/outputs and TypeScript types generated or mirrored from OpenAPI schemas.
3. **Structured Outputs:** Ensure all LLM prompts in LangGraph use Pydantic structured output models with retry and fallback degradation.
4. **Clean Code:** Write modular, readable, self-documenting code without extraneous dependencies or bloated templates.
