# PolicyPilot — Judge Questions & Authoritative Answers
**Team Axiom | HACK-X 2026 | Generative & Agentic AI**
*Authors: Mariya Fatima (Team Lead), Nameera Sadaf, Shaik Rehan Ahmed*

---

### Q1: What problem does PolicyPilot solve?
**Answer:**
India has hundreds of Central and State welfare programs with over ₹3 Lakh Crore in annual budgetary allocations. However, eligible citizens routinely fail to receive benefits due to:
1. **Information Asymmetry:** Rules are published in complex legal gazettes and scattered across fragmented ministry websites.
2. **AI Hallucination in Consumer Chatbots:** Citizens who query general LLMs (ChatGPT, Claude) receive inaccurate criteria, fabricated deadlines, and false eligibility promises.
3. **Application Friction & Bureaucratic Confusion:** Citizens do not know whether a scheme transfers cash via bank DBT or provides cashless services at a hospital (e.g., PM-JAY), leading to wasted trips to government offices.

PolicyPilot solves this by enforcing a **strict separation between deterministic rule evaluation and generative language synthesis**, backing every criterion check with verified official gazette clauses and actionable, scheme-specific roadmaps.

---

### Q2: Which AI model is used?
**Answer:**
The target language model is **Google Gemini 3.8 Flash** via the official Google GenAI SDK, paired with **Gemini Embedding 2** producing 768-dimensional vector representations for semantic evidence retrieval. When connected, Gemini synthesizes plain-language citizen summaries and handles multilingual translation.

---

### Q3: Is Gemini live during this demonstration?
**Answer:**
During local hackathon judging, **no external Gemini API key is required**, and the system transparently indicates:
- **`AI: Deterministic Fallback`**
- **`Retrieval: Lexical (Gazette)`**

We intentionally refuse to fake AI connectivity. When running in local demo mode, our deterministic synthesis engine uses verified gazette rule templates. The application is architecturally designed so that adding a valid `GEMINI_API_KEY` in the backend `.env` immediately activates live Gemini 3.8 Flash generation without any code changes.

---

### Q4: What is LangGraph doing in your architecture?
**Answer:**
LangGraph orchestrates the multi-step citizen journey as an immutable, stateful **Directed Acyclic Graph (DAG)** with conditional routing:
1. **Node 1 (`normalize_profile`):** Validates and coerces demographic data, income floats, caste tokens, and statutory declarations.
2. **Node 2 (`discover_schemes`):** Matches and ranks relevant schemes based on category, state, and demographic criteria.
   - *Conditional Edge (`route_after_discovery`):* If no schemes match, routes to `no_schemes_fallback` to generate advisory guidance; otherwise continues to `evaluate_rules`.
3. **Node 3 (`evaluate_rules`):** Deterministic Python rule engine evaluates all criteria (Zero LLM reliance).
4. **Node 4 (`check_missing_info`):** Inspects missing profile fields and quantifies honest uncertainty.
5. **Node 5 (`retrieve_evidence`):** Retrieves official Gazette excerpts, trust tiers, and verified citations.
6. **Node 6 (`generate_action_plan`):** Assembles chronological action roadmap and invokes grounded explanation (Gemini or deterministic fallback).

LangGraph ensures state immutability, provides real-time step execution logs, and executes actual operational responsibilities rather than being a decorative wrapper.

---

### Q5: Why are eligibility decisions deterministic instead of AI-generated?
**Answer:**
**Because generative AI must never make binding legal decisions.**
LLMs are probabilistic token predictors prone to drift, hallucinations, and arithmetic errors. If an AI falsely tells an impoverished citizen they qualify for a ₹1.2 Lakh housing subsidy, they may take loans they cannot repay. Conversely, if an AI wrongly rejects an eligible applicant, they are denied a legal entitlement.

In PolicyPilot, eligibility criteria are represented as strictly typed comparison operations (`EQUALS`, `LESS_THAN_OR_EQUAL`, `IN_LIST`) executed by a Python engine. The decision is 100% mathematical, deterministic, and auditable in a court of law.

---

### Q6: How are citations obtained and verified?
**Answer:**
Citations are not invented by an LLM. In our seed registry, every scheme criterion maps to a structured `EvidenceChunk` containing:
- Canonical government portal URL (e.g., `https://pmkisan.gov.in/`)
- Publishing ministry (e.g., *Ministry of Agriculture and Farmers Welfare*)
- Specific gazette clause or section (e.g., *Section 3.1 — Landholding Limits*)
- Exact, verbatim excerpt from official guidelines.

During evaluation, the system matches the evaluated criterion to this authoritative evidence record, ensuring every claim is legally grounded.

---

### Q7: What happens when an official source is broken or outdated?
**Answer:**
We actively monitor source health:
1. During our Phase 1 & 2 audit, we discovered that legacy links (such as `pmayg.nic.in` or old PM-KISAN PDF paths) were failing DNS resolution or returning 404s. We migrated them to active canonical portals (`pmayg.gov.in`, `pmkisan.gov.in`).
2. If a government URL cannot be verified or times out, the system marks its verification status as **`PENDING_VERIFICATION`** or **`UNAVAILABLE`**.
3. We never silently invent replacement text, fake publication dates, or hide dead links.

---

### Q8: How is PolicyPilot different from myScheme and existing government portals?
**Answer:**
Existing portals like myScheme are valuable centralized catalogs, but PolicyPilot offers distinct architectural advantages:

| Dimension | myScheme / Central Portals | PolicyPilot |
| :--- | :--- | :--- |
| **Reasoning Engine** | Static questionnaire filtering | Deterministic multi-criterion engine with uncertainty quantification (`INSUFFICIENT_INFORMATION`) |
| **Evidence Traceability** | High-level bullet points | Direct clause-by-clause gazette excerpts and citations |
| **Action Plan Depth** | Generic portal links | Scheme-specific roadmaps differentiating **Cashless Hospitalization** from **Bank DBT** |
| **Document Guidance** | Blanket checklists | Explicit `NOT_APPLICABLE` tags (e.g., no bank passbook needed for PM-JAY) |
| **Portability** | Requires centralized cloud connectivity | Zero-dependency local demonstration with offline fallback |

---

### Q9: Why is a separate database not connected during this demonstration?
**Answer:**
To guarantee **100% demo reliability and portability**.
Live hackathon environments often fail due to Docker port conflicts, database network timeouts, or corrupted local volumes. We built a thread-safe, in-memory demo repository containing our verified benchmark schemes.

However, our production persistence layer is already written:
- Async SQLAlchemy 2.0 models (`services/api/app/db/models.py`)
- Complete Alembic migration (`001_initial_schema.py`) configuring PostgreSQL and `pgvector` with 768-dimensional embedding support.
Connecting to an external PostgreSQL instance only requires setting `DATABASE_URL` in `.env`.

---

### Q10: How does the prototype protect citizen profile data?
**Answer:**
1. **Zero PII Collection:** The system does not request or store Aadhaar numbers, PAN cards, phone numbers, voter IDs, or applicant names.
2. **Stateless Request Scope:** Profile attributes are processed in transient server memory during the evaluation request and are immediately discarded.
3. **Client-Side Persistence:** Demographic presets are stored strictly in the user's browser `localStorage` and can be wiped instantly by clicking "Reset Profile".
4. **No Third-Party Analytics:** Zero telemetry scripts, advertising trackers, or unvetted external webhooks.

---

### Q11: What are the current limitations of PolicyPilot?
**Answer:**
We maintain complete honesty regarding current limitations:
1. **Curated Seed Coverage:** The current demonstration covers 5 benchmark Central and State schemes (PM-KISAN, PM-JAY, PMAY-G, NSP Post-Matric, Rythu Bharosa). It does not yet cover all 2,000+ Indian welfare schemes.
2. **Pre-Screening Only:** PolicyPilot provides eligibility pre-screening and application guidance; it does not directly submit applications or legally guarantee benefit disbursement.
3. **Language Support:** Full natural language translation across 22 Scheduled Indian languages requires an active Gemini API connection; the offline fallback is currently in English.
4. **State-Level Dynamic Rules:** Regional land record integration (e.g., Dharani/CCLA API in Telangana) is simulated via structured profile inputs rather than live state database integration.

---

### Q12: What would be needed for real-world production deployment?
**Answer:**
To transition PolicyPilot from hackathon prototype to national deployment:
1. **Automated Gazette Ingestion Pipeline:** An asynchronous crawler that ingests newly published e-Gazettes (`egazette.gov.in`) and ministry notifications, extracts criteria using LangGraph agents, and flags rules for human-in-the-loop legal review.
2. **DigiLocker & API Setu Integration:** Consent-based integration with DigiLocker to auto-verify land records, caste certificates, and ration cards without manual user data entry.
3. **Voice & Multilingual Interface:** Native speech-to-text and text-to-speech in rural Indian languages (using Google Speech and Gemini multimodal capabilities) to support low-literacy citizens.
4. **Scalable Vector Infrastructure:** Activating our existing pgvector schemas on a managed PostgreSQL cluster (e.g., Cloud SQL) for semantic search over millions of gazette clauses.
