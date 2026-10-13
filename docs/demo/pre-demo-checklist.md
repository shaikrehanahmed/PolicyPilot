# PolicyPilot — Pre-Demo Checklist & Launch Protocol
**Team Axiom | HACK-X 2026 | Generative & Agentic AI**
*Authors: Mariya Fatima (Team Lead), Nameera Sadaf, Shaik Rehan Ahmed*

---

## 1. Quick Launch Commands

To start both services in clean local demonstration mode:

### Terminal 1: FastAPI Backend
```powershell
cd "c:\antigravity projects\PolicyPilot\services\api"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Expected Output:*
```
INFO:     Started server process [pid]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Terminal 2: Next.js Frontend
```powershell
cd "c:\antigravity projects\PolicyPilot\apps\web"
npm run dev -- --port 3000
```
*Expected Output:*
```
▲ Next.js 16.0.7 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://[local-ip]:3000
✓ Ready in 1.2s
```

---

## 2. Pre-Flight Endpoint Health Verification

Before presenting to judges, verify all critical API endpoints in PowerShell:

```powershell
# 1. Health Status & Honest Indicators
curl.exe -s http://127.0.0.1:8000/api/v1/health | ConvertFrom-Json | Format-List

# 2. Scheme Listing (Must return 5 benchmark schemes)
(curl.exe -s http://127.0.0.1:8000/api/v1/schemes | ConvertFrom-Json).Count

# 3. Official Sources Count (Must return 5 verified sources)
(curl.exe -s http://127.0.0.1:8000/api/v1/sources | ConvertFrom-Json).Count

# 4. Deterministic Evaluation Probe (Ramesh Patel persona)
$body = '{"age":42,"gender":"MALE","state":"Telangana","locality":"RURAL","annual_income":120000,"occupation":"FARMER","landholding_hectares":1.2,"social_category":"OBC","disability":false,"bpl_card":false}'
curl.exe -s -X POST "http://127.0.0.1:8000/api/v1/evaluate" -H "Content-Type: application/json" -d $body | ConvertFrom-Json | Select-Object -ExpandProperty results | Format-Table scheme_id, status, annual_benefit_inr
```

### Verification Criteria:
- Health response reports:
  - `ai_status: deterministic_fallback`
  - `retrieval_mode: lexical`
  - `database: demo_in_memory`
- Scheme count: **5** (`pm-kisan`, `pm-jay`, `pmay-g`, `nsp-post-matric`, `rythu-bharosa`)
- Evaluation results: PM-KISAN = `ELIGIBLE`, Rythu Bharosa = `ELIGIBLE`.

---

## 3. Browser & UI Inspection Checklist

Open `http://localhost:3000` in Google Chrome or Edge:

- [ ] **Navbar Status Pills:**
  - `AI: Deterministic Fallback` is displayed in a subtle slate badge.
  - `Retrieval: Lexical (Gazette)` is displayed in a blue badge.
  - `DB: Demo In-Memory` is displayed in an emerald badge.
- [ ] **No Hydration / Overlay Errors:**
  - Verify bottom-left screen has **NO red "Issues" button**.
  - Browser DevTools Console has **zero hydration errors** or warnings.
- [ ] **Indian Currency Formatting:**
  - Amounts render as `₹6,000`, `₹1,20,000`, `₹5,00,000` (Lakh format).
- [ ] **Preset Buttons Work:**
  - Clicking "Ramesh Patel (Smallholder Farmer)" updates state instantly.
  - Clicking "Check Eligibility" navigates to `/eligibility` without reload loops.

---

## 4. Official Government Source Link Audit

Verify that clicking official source buttons in the UI opens the working canonical portals in a new tab:

| Scheme ID | Portal Title | Canonical URL | Verified Status |
| :--- | :--- | :--- | :---: |
| `pm-kisan` | PM-KISAN Central Portal | `https://pmkisan.gov.in/` | **VERIFIED (200 OK)** |
| `pm-jay` | Ayushman Bharat NHA Portal | `https://nha.gov.in/PM-JAY` | **VERIFIED (200 OK)** |
| `pmay-g` | Pradhan Mantri Awaas Yojana Gramin | `https://pmayg.gov.in/` | **VERIFIED (200 OK)** |
| `nsp-post-matric` | National Scholarship Portal | `https://scholarships.gov.in/All-Scholarships` | **VERIFIED (200 OK)** |
| `rythu-bharosa` | Telangana Rythu Bharosa Portal | `https://rythubharosa.telangana.gov.in/Default_Eng.aspx` | **VERIFIED (200 OK)** |

---

## 5. Live Demo Execution Plan

1. **Step 1 (0:00):** Introduce Team Axiom and the core thesis: *“AI never decides eligibility; rules are deterministic; evidence is gazette-grounded.”* Point out the honest fallback pill in the navbar.
2. **Step 2 (1:00):** Select preset **Ramesh Patel**, show instant evaluation (<40ms), show eligibility for PM-KISAN and Rythu Bharosa.
3. **Step 3 (2:00):** Expand PM-KISAN evidence card, show Clause 3.1 gazette excerpt, click canonical link (`pmkisan.gov.in`).
4. **Step 4 (2:45):** Generate Action Plan for PM-KISAN (DBT transfer), then contrast with PM-JAY (Cashless hospital service; bank account = `NOT_APPLICABLE`).
5. **Step 5 (3:30):** Clear Landholding field, show status changes to **`INSUFFICIENT_INFORMATION`** with uncertainty prompt.
6. **Step 6 (4:15):** Pitch production readiness (FastAPI, Pydantic, LangGraph, pgvector 768-dim migrations) and conclude.

---

## 6. Emergency Contingency & Backup Procedures

| What went wrong | Immediate fix during presentation |
| :--- | :--- |
| **Browser tab froze or state looks stale** | Press `Ctrl + Shift + R` (Hard reload) or click **"Reset Profile"** on `/profile`. |
| **Backend terminal crashed** | Run `uvicorn app.main:app --host 127.0.0.1 --port 8000` in the dedicated PowerShell tab. Server boots in <800ms. |
| **Judge asks to test another state or persona** | Select **Sunita Devi** (Rural Bihar BPL -> PM-JAY, PMAY-G) or **Arjun Kumar** (Telangana Student -> NSP). |
| **Judge asks why Gemini isn't called** | Explain: *"We built a fully functioning deterministic fallback so PolicyPilot never fails on unstable hackathon Wi-Fi. Gemini 3.8 Flash is ready to connect the moment an API key is provided."* |
