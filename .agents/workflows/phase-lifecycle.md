# PolicyPilot Phase Lifecycle Workflow

This workflow governs how each implementation phase is executed across the project lifecycle.

## The Mandatory Phase Execution Loop

For every phase (Phases 1 through 5):

1. **Inspect:** Check current repository state, existing files, and environment tools.
2. **Plan:** Draft an implementation plan covering specific components, schemas, and tests.
3. **Scaffold & Implement:** Write clean, modular, typed code adhering strictly to the architecture.
4. **Execute Tests:** Run automated test suites (e.g. `pytest`, `npm test`) and capture actual results.
5. **Launch & Verify:** Run the local service / dev server and verify endpoints or UI flows.
6. **Remediate:** Fix any errors, warnings, or regressions immediately.
7. **Document & Artifact:** Create or update phase summary notes and verification logs.
8. **User Review Gate:** Stop and present the results to the user for formal review before proceeding to the next phase.

```
Inspect ──► Plan ──► Implement ──► Test ──► Verify ──► Review Gate ──► Next Phase
  ▲                                           │
  └──────────────── Fix / Remediate ──────────┘
```
