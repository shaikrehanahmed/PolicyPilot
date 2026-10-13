import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'PolicyPilot-Verifier'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'PolicyPilot-Verifier'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("=== STEP 1: HEALTH & SYSTEM STATUS CHECK ===")
h = get("http://127.0.0.1:8000/api/health")
print(f"Health: {h['status']} | Demo: {h['demo_mode']} | Database: {h['database']} | LLM: {h['llm_status']} | Retrieval: {h['retrieval_mode']}")
assert h["demo_mode"] is True
assert h["llm_status"] == "deterministic_fallback"
assert h["retrieval_mode"] == "lexical"

print("\n=== STEP 2: PROFILE NORMALIZATION & VALIDATION ===")
pv = post("http://127.0.0.1:8000/api/v1/profile/validate", {
    "profile": {
        "state": "ts",
        "age": "42",
        "annual_income_inr": "₹ 1,20,000",
        "occupation": "Farmer",
        "category": "obc",
        "landholding_acres": "2.5"
    }
})
print(f"Valid: {pv['valid']} | State: {pv['normalized_profile']['state']} | Income: {pv['normalized_profile']['annual_income_inr']}")
assert pv["valid"] is True
assert pv["normalized_profile"]["state"] == "TS"
assert pv["normalized_profile"]["occupation"] == "farmer"

print("\n=== STEP 3: SCHEME DISCOVERY & INTENT RANKING ===")
disc = post("http://127.0.0.1:8000/api/v1/schemes/discover", {
    "profile": pv["normalized_profile"],
    "goal": "farming input subsidy"
})
print(f"Discovered {len(disc)} scheme(s):")
for s in disc:
    print(f"  • {s['name']} [Score: {s.get('relevance_score')}, Level: {s.get('level')}]")
assert len(disc) >= 2

print("\n=== STEP 4: PM-KISAN DETERMINISTIC EVALUATION (COMPLETE & ELIGIBLE) ===")
ev_el = post("http://127.0.0.1:8000/api/v1/eligibility/evaluate", {
    "scheme_id": "pm-kisan",
    "profile": {
        "occupation": "farmer",
        "landholding_acres": 3.5,
        "is_institutional_landholder": False,
        "is_government_employee": False,
        "is_income_tax_payee": False,
        "has_constitutional_post_holder": False,
        "has_specified_elected_representative": False,
        "has_pensioner_above_10k_non_mts": False,
        "has_practicing_professional": False,
        "is_nri_or_foreign_resident": False,
    }
})
print(f"Status: {ev_el['status']} | Completeness: {ev_el['completeness']} | Total Criteria: {len(ev_el['criteria'])}")
assert ev_el["status"] == "ELIGIBLE"
assert ev_el["completeness"] == "COMPLETE"
assert len(ev_el["criteria"]) == 10

print("\n=== STEP 5: PM-KISAN MTS / CLASS IV EXEMPTION AUDIT ===")
ev_mts = post("http://127.0.0.1:8000/api/v1/eligibility/evaluate", {
    "scheme_id": "pm-kisan",
    "profile": {
        "occupation": "farmer",
        "landholding_acres": 2.0,
        "is_institutional_landholder": False,
        "is_government_employee": True,
        "is_mts_or_class_iv": True,  # EXPLICITLY EXEMPT UNDER CLAUSE 2(b)(iii)
        "is_income_tax_payee": False,
        "has_constitutional_post_holder": False,
        "has_specified_elected_representative": False,
        "has_pensioner_above_10k_non_mts": False,
        "has_practicing_professional": False,
        "is_nri_or_foreign_resident": False,
    }
})
print(f"MTS Status: {ev_mts['status']} | MTS Exemption correctly applied: {ev_mts['status'] == 'ELIGIBLE'}")
assert ev_mts["status"] == "ELIGIBLE"

print("\n=== STEP 6: PM-KISAN STATUTORY EXCLUSION (TAX PAYEE) ===")
ev_tax = post("http://127.0.0.1:8000/api/v1/eligibility/evaluate", {
    "scheme_id": "pm-kisan",
    "profile": {
        "occupation": "farmer",
        "landholding_acres": 3.5,
        "is_institutional_landholder": False,
        "is_government_employee": False,
        "is_income_tax_payee": True,
        "has_constitutional_post_holder": False,
        "has_specified_elected_representative": False,
        "has_pensioner_above_10k_non_mts": False,
        "has_practicing_professional": False,
        "is_nri_or_foreign_resident": False,
    }
})
print(f"Status: {ev_tax['status']} (Correctly rejected due to Clause 3(b)(v) statutory exclusion)")
assert ev_tax["status"] == "NOT_ELIGIBLE"

print("\n=== STEP 7: PM-JAY UNIVERSAL SENIOR 70+ DISJUNCTIVE PATHWAY ===")
ev_sr = post("http://127.0.0.1:8000/api/v1/eligibility/evaluate", {
    "scheme_id": "pm-jay",
    "profile": {
        "age": 75,
        "annual_income_inr": 1500000,  # High income — exceeds vulnerable household cap
        "category": "General",
    }
})
print(f"Senior Status: {ev_sr['status']} | Pathway: {ev_sr['why_this_result']}")
assert ev_sr["status"] == "ELIGIBLE"
assert "senior_70_plus" in ev_sr["why_this_result"].lower() or "senior" in ev_sr["why_this_result"].lower()

print("\n=== STEP 8: RYTHU BHAROSA TELANGANA BENEFIT AUDIT ===")
rb = get("http://127.0.0.1:8000/api/v1/schemes/rythu-bharosa")
print(f"Scheme Name: {rb['name']}")
print(f"Benefit text verified: {rb['description'][:100]}...")
assert "12,000" in rb["description"]
rb_plan = post("http://127.0.0.1:8000/api/v1/action-plans/generate", {
    "scheme_id": "rythu-bharosa",
    "profile": {"state": "TS", "occupation": "farmer", "landholding_acres": 2.5}
})
print(f"Action plan status: {rb_plan['overall_status']}")
assert rb_plan["overall_status"] == "ELIGIBLE"
assert any("12,000" in step["action"] for step in rb_plan["roadmap"])

print("\n=== STEP 9: PMAY-G LIVE 15-POINT QUESTIONNAIRE & UNCERTAINTY HANDLING ===")
pmay_inc = post("http://127.0.0.1:8000/api/v1/eligibility/evaluate", {
    "scheme_id": "pmay-g",
    "profile": {"annual_income_inr": 150000, "residence_area": "rural"}
})
print(f"Incomplete Status: {pmay_inc['status']} | Completeness: {pmay_inc['completeness']}")
print(f"Missing required fields: {pmay_inc['missing_information']}")
assert pmay_inc["status"] == "PARTIALLY_ELIGIBLE"
assert pmay_inc["completeness"] == "INCOMPLETE"
assert "owns_pucca_house" in pmay_inc["missing_information"]

pmay_disq = post("http://127.0.0.1:8000/api/v1/eligibility/evaluate", {
    "scheme_id": "pmay-g",
    "profile": {
        "annual_income_inr": 120000,
        "residence_area": "rural",
        "owns_pucca_house": True,
        "lives_in_kutcha_house": False,
        "has_more_than_two_pucca_rooms": False,
        "has_motorized_vehicle": False,
        "has_mechanized_agri_equipment": False,
        "has_kcc_above_50k": False,
        "is_government_employee": False,
        "has_registered_non_agri_enterprise": False,
        "earns_above_15k_monthly": False,
        "is_income_tax_payee": False,
        "pays_professional_tax": False,
        "irrigated_land_acres": 0.0,
        "unirrigated_land_acres": 1.0,
    }
})
print(f"Disqualified Status: {pmay_disq['status']} | Completeness: {pmay_disq['completeness']}")
assert pmay_disq["status"] == "NOT_ELIGIBLE"
assert pmay_disq["completeness"] == "COMPLETE"

print("\n=== STEP 10: PM-JAY CASHLESS HOSPITALIZATION AUDIT ===")
pmjay_plan = post("http://127.0.0.1:8000/api/v1/action-plans/generate", {
    "scheme_id": "pm-jay",
    "profile": {"annual_income_inr": 180000, "category": "OBC"}
})
print(f"PM-JAY Official Portal: {pmjay_plan['official_portal_url']}")
titles = [s["title"] for s in pmjay_plan["roadmap"]]
print(f"Roadmap Steps: {titles}")
assert any("Cashless" in t for t in titles)
bank_doc = next((d for d in pmjay_plan["required_documents"] if "Bank" in d["name"]), None)
print(f"Bank Account requirement: {bank_doc.get('requirement_type') if bank_doc else 'None'}")
assert bank_doc["requirement_type"] == "NOT_APPLICABLE"

print("\n=== STEP 11: LANGGRAPH AGENTIC WORKFLOW EXECUTION ===")
wf = post("http://127.0.0.1:8000/api/v1/workflow/run", {
    "profile": {
        "state": "TS",
        "occupation": "farmer",
        "landholding_acres": 2.5,
        "annual_income_inr": 120000,
        "is_institutional_landholder": False,
        "is_government_employee": False,
        "is_income_tax_payee": False,
        "has_constitutional_post_holder": False,
        "has_specified_elected_representative": False,
        "has_pensioner_above_10k_non_mts": False,
        "has_practicing_professional": False,
        "is_nri_or_foreign_resident": False,
    },
    "goal": "farming subsidy"
})
print(f"Workflow Status: {wf['status']}")
for s in wf["steps_log"]:
    print(f"  ✓ {s['step_name']}: {s['detail']}")
assert wf["status"] == "SUCCESS"
assert len(wf["steps_log"]) == 6

print("\n=== STEP 12: OFFICIAL SOURCES & EVIDENCE REGISTRY ===")
sources = get("http://127.0.0.1:8000/api/v1/sources")
print(f"Registered Official Sources: {len(sources)}")
for src in sources:
    print(f"  • [{src['verification_status']}] Tier {src['source_tier']}: {src['title']} ({src['publisher']})")
assert len(sources) >= 5

print("\n================================================================================")
print(">>> ALL 12 END-TO-END AUDIT GATES VERIFIED AND PASSED SUCCESSFULLY! <<<")
print("================================================================================")
