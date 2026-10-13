# PolicyPilot — Live 4–5 Minute Judging Demonstration Script
**Team Axiom | HACK-X 2026 | Generative & Agentic AI**
*Presenters: Mariya Fatima (Team Lead), Nameera Sadaf, Shaik Rehan Ahmed*

---

## Demonstration Quick Reference Sheet

- **Primary Persona:** Ramesh Patel (42, Telangana, Smallholder Farmer, Land 1.2 Ha, Income ₹1,20,000, OBC)
- **Target Schemes:** PM-KISAN (Eligible), Rythu Bharosa (Eligible)
- **Uncertainty Demo:** Incomplete Landholding Profile (Triggers `INSUFFICIENT_INFORMATION`)
- **Cashless Comparison:** Sunita Devi / PM-JAY (Cashless hospital entitlement without bank DBT)
- **Frontend URL:** `http://localhost:3000`
- **Backend API Docs:** `http://127.0.0.1:8000/docs`
- **Estimated Duration:** 4 minutes 30 seconds

---

## Timed Walkthrough Script

### **0:00 – 0:45 | Introduction & The Transparency Guarantee**

#### Action:
1. Open browser to `http://localhost:3000`.
2. Ensure both browser window and backend terminal are healthy.

#### What to Say:
> *"Respected judges, every year thousands of Indian citizens miss out on life-changing welfare schemes or fall victim to fake application portals. The root cause is twofold: government rules are buried in complex legal gazettes, and general-purpose AI models hallucinate eligibility criteria, promising benefits citizens cannot actually claim.*
>
> *We built **PolicyPilot** with Team Axiom to solve this. PolicyPilot is an **agentic, audit-first welfare navigator** built on a strict rule: **AI never decides eligibility.** Mathematical rules are executed by a deterministic Python engine, and every decision is legally grounded in verified official gazettes.*
>
> *Notice our navbar header right now: it displays **`AI: Deterministic Fallback`** and **`Retrieval: Lexical (Gazette)`**. We don't hide our operational status—if an external LLM is offline or unconfigured, we tell the citizen upfront. Our application runs 100% locally with zero cloud dependencies."*

#### Point out on screen:
- The system status pills in the top-right navbar:
  - `AI: Deterministic Fallback` (Slate badge)
  - `Retrieval: Lexical (Gazette)` (Blue badge)
  - `DB: Demo In-Memory` (Emerald badge)
- The clean, hydration-error-free Next.js interface.

---

### **0:45 – 1:45 | Primary Citizen Journey: The Smallholder Farmer**

#### Action:
1. On the landing page, click the preset button: **"Ramesh Patel (Smallholder Farmer)"** (or click **"Assess My Eligibility"** and select Ramesh Patel from the presets).
2. The profile form instantly populates:
   - State: **Telangana**
   - Locality: **Rural**
   - Occupation: **Farmer**
   - Landholding: **1.2 Hectares**
   - Annual Income: **₹1,20,000**
   - Social Category: **OBC**
3. Click **"Check Eligibility & Match Schemes"**.

#### What to Say:
> *"Let's take our first citizen persona: **Ramesh Patel**, a 42-year-old smallholder farmer in rural Telangana with 1.2 hectares of land and an annual household income of ₹1,20,000.*
>
> *With one click, our deterministic engine evaluates Ramesh's profile across Central and State welfare rules in under 40 milliseconds. Let's look at the results."*

#### Point out on screen:
- Navigate to the **Eligibility Results** page.
- Show **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**:
  - Status: **`ELIGIBLE`** (Green badge)
  - Annual Benefit: **₹6,000 / year**
- Show **Telangana Rythu Bharosa**:
  - Status: **`ELIGIBLE`** (Green badge)
  - State Benefit: **₹12,000 / acre / year (₹6,000 per season)**
- Show the **Criterion-by-Criterion Breakdown** under PM-KISAN:
  - `Farmer Occupation Check`: **MET** (Active cultivator status)
  - `Landholding Check`: **MET** (Recorded cultivable agricultural landholding)
  - `Statutory Exclusions Check`: **MET** (Not institutional landholder, not govt employee, not income tax payee)

---

### **1:45 – 2:30 | Gazette Evidence Grounding & Canonical Link Probing**

#### Action:
1. Under PM-KISAN, click **"View Official Evidence & Citations"** or expand the Evidence card.
2. Click the canonical link: **`https://pmkisan.gov.in/`**.
3. Point out the exact gazette excerpt displayed on screen.

#### What to Say:
> *"Here is what sets PolicyPilot apart from any generic chatbot. Anyone can say 'you are eligible.' PolicyPilot proves it by linking the evaluation to official ministry gazettes.*
>
> *Under PM-KISAN, the system retrieves the official Operational Guidelines published by the Ministry of Agriculture and Farmers Welfare. It cites the authoritative definition: 'A landholder farmer family is defined as a family comprising husband, wife and minor children who own cultivable land as per land records of the concerned State/UT, excluding institutional landholders, government employees, and income tax payees.'*
>
> *Furthermore, every source in our registry is verified. We audited old fixture links and fixed broken 404 PDFs. When we click this official link, it takes the citizen directly to the live, working central portal at `pmkisan.gov.in`—or secondary verification on `myscheme.gov.in`."*

#### Point out on screen:
- The exact Gazette clause citation.
- Publisher: *Ministry of Agriculture and Farmers Welfare*.
- Canonical URL opens safely in a new tab.

---

### **2:30 – 3:15 | Scheme-Specific Action Plan: Cashless vs. DBT**

#### Action:
1. Click **"Generate Action Plan"** for **PM-KISAN**.
2. Point out the 4 structured phases: Document Prep → Application Submission → Verification → Disbursement.
3. Next, quickly show **PM-JAY (Ayushman Bharat)** by clicking into its Scheme Detail page.
4. Point out the **Document Checklist** for PM-JAY.

#### What to Say:
> *"Now let's examine the action plan. Generic systems generate a lazy Aadhaar-DBT boilerplate for every scheme. But in the real world, government schemes work very differently.*
>
> *For PM-KISAN, the action plan correctly guides Ramesh to verify his land record (Pattadar passbook) at the local Revenue Office and seed his bank account with Aadhaar for PFMS Direct Benefit Transfer.*
>
> *However, look at **PM-JAY (Ayushman Bharat)**. PM-JAY is a **100% cashless hospital entitlement** providing ₹5 Lakh coverage directly at empaneled hospitals. It does NOT transfer cash to a bank account. Notice our verified document checklist: Bank Passbook is explicitly marked **`NOT APPLICABLE`**. The citizen only needs their Ration Card and a Government Photo ID to generate their Golden Card at the hospital helpdesk. We save citizens from running in circles for paperwork they do not need."*

#### Point out on screen:
- PM-KISAN Action Plan: Highlights Farmers Corner, CSC centers, and PFMS DBT credit.
- PM-JAY Document Checklist:
  - Ration Card / SECC 2011: `MANDATORY`
  - Government Photo ID (Aadhaar/Voter ID): `MANDATORY`
  - Bank Account Passbook: `NOT APPLICABLE` with note *"Cashless scheme at hospital; no bank account or DBT needed."*

---

### **3:15 – 3:50 | Uncertainty & Incomplete Information Handling**

#### Action:
1. Navigate back to **Profile** (`/profile`).
2. Select the preset **"Incomplete Profile (Missing Landholding)"** (or clear the Landholding Hectares field).
3. Click **"Check Eligibility & Match Schemes"**.

#### What to Say:
> *"What happens when a citizen doesn't know their exact landholding? A bad AI guesses or hallucinates a pass. A rigid system rejects them outright.*
>
> *Look at PolicyPilot's response: PM-KISAN status changes from `ELIGIBLE` to **`INSUFFICIENT INFORMATION`**. The engine flags: 'Agricultural landholding was not provided in profile; cannot verify maximum 2.0 Ha limit.'*
>
> *It provides an amber uncertainty alert: 'Please provide your landholding records or survey number to verify this criterion.' We treat citizen uncertainty with total mathematical honesty."*

#### Point out on screen:
- Amber badge: **`INSUFFICIENT INFORMATION`**.
- Detailed reason explaining which exact criterion could not be evaluated.
- Prompt for the citizen to provide missing records.

---

### **3:50 – 4:30 | Closing Pitch, Architecture Summary & Judge Handover**

#### What to Say:
> *"To summarize our architecture for the judging panel:
> 1. **Next.js 16 frontend** with React 19, zero hydration errors, and accessible, responsive styling.
> 2. **FastAPI backend** running deterministic Python rule evaluations in under 40ms.
> 3. **LangGraph state machine** coordinating evidence retrieval, rule checks, and natural language synthesis.
> 4. **Dual AI Mode**: Online with Gemini 3.8 Flash, or 100% functional offline with deterministic gazette templates.
> 5. **Production Ready**: Fully verified async SQLAlchemy and pgvector migrations for 768-dimensional embeddings, with a self-contained in-memory demo repository for zero-dependency portability.
>
> *PolicyPilot transforms welfare discovery from a bureaucratic maze into an auditable, trustworthy citizen right. Thank you, and we welcome your questions!"*

---

## Backup Demonstration Scenarios

### Backup Scenario A: The Marginalized Student (Higher Education)
- **Profile:** Arjun Kumar (19, Urban, Telangana, Student, SC, Income ₹1,80,000).
- **Target Scheme:** National Scholarship Portal (NSP Post-Matric).
- **Key Highlight:** Demonstrates income threshold (<= ₹2,50,000 for SC/ST), institutional Level-1 verification step, and One-Time Registration (OTR) on `scholarships.gov.in`.

### Backup Scenario B: High Income Disqualification
- **Profile:** Vikram Singh (32, Urban, Maharashtra, Salaried, Income ₹14,00,000).
- **Target Scheme:** All schemes.
- **Key Highlight:** Immediate, unequivocal **`NOT ELIGIBLE`** across all welfare programs with clear income violation explanations (e.g., Income ₹14,00,000 exceeds ₹2,50,000 ceiling). Proves the engine rejects false beneficiaries.

---

## Quick Judge Q&A Cheat Sheet

| Question | Short Winning Response |
| :--- | :--- |
| **Why not let Gemini decide eligibility?** | *"LLMs are probabilistic and prone to hallucination. Eligibility for public funds must be legally deterministic and auditable in court."* |
| **Why does the navbar say 'AI: Deterministic Fallback'?** | *"Because we refuse to fake AI output. When running locally without external credentials, we tell the user honestly that responses are deterministic gazette templates."* |
| **How is this different from myScheme?** | *"myScheme provides static checklists. PolicyPilot provides deterministic evaluation, gazette clause evidence, cashless vs DBT document separation, and LangGraph workflow orchestration."* |
| **Can this scale to a live production database?** | *"Yes! We have written and verified async SQLAlchemy 2.0 models and Alembic migrations with pgvector 768-dim indexing, fully compatible with Google Gemini Embedding 2."* |
