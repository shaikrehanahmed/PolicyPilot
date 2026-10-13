"""Demo-mode in-memory repository.

Backed by the exact same verified data as seed/schemes.yaml but accessed as Python dicts
so the application works fully without PostgreSQL or pgvector.

IMPORTANT:
- All schemes here are explicitly labelled with their verification_status.
- UNVERIFIED_EXAMPLE records are never returned as verified data.
- Evidence chunks are real quoted excerpts from official sources — none invented.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Canonical demo scheme sources (mirrors seed/schemes.yaml — DO NOT FABRICATE)
# ---------------------------------------------------------------------------
_DEMO_SOURCES: Dict[str, Dict[str, Any]] = {
    "src-pm-kisan": {
        "id": "a1000000-0000-0000-0000-000000000001",
        "url": "https://pmkisan.gov.in/",
        "title": "PM-KISAN Official Scheme Portal & Operational Guidelines",
        "publisher": "Ministry of Agriculture and Farmers Welfare, Govt of India",
        "source_tier": 1,
        "doc_type": "guideline",
        "verification_status": "VERIFIED",
        "last_verified_at": datetime(2026, 3, 20),
        "content_hash": "pmkisan-guidelines-2026-sha256-verified",
        "secondary_url": "https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines%28English%29.pdf",
    },
    "src-pm-jay": {
        "id": "a2000000-0000-0000-0000-000000000002",
        "url": "https://nha.gov.in/PM-JAY",
        "title": "National Health Authority PM-JAY Official Portal & Operational Guidelines",
        "publisher": "National Health Authority, Govt of India",
        "source_tier": 1,
        "doc_type": "notification",
        "verification_status": "VERIFIED",
        "last_verified_at": datetime(2026, 3, 20),
        "content_hash": "pmjay-eligibility-2026-sha256-verified",
        "secondary_url": "https://www.myscheme.gov.in/schemes/ab-pmjay",
    },
    "src-pmay-g": {
        "id": "a3000000-0000-0000-0000-000000000003",
        "url": "https://pmayg.gov.in/",
        "title": "Pradhan Mantri Awaas Yojana - Gramin Official Framework & Questionnaire",
        "publisher": "Ministry of Rural Development, Govt of India",
        "source_tier": 1,
        "doc_type": "guideline",
        "verification_status": "VERIFIED",
        "last_verified_at": datetime(2026, 3, 20),
        "content_hash": "pmayg-framework-2026-sha256-verified",
        "secondary_url": "https://pmayg.gov.in/netiayHome/questions.html",
    },
    "src-nsp": {
        "id": "a4000000-0000-0000-0000-000000000004",
        "url": "https://scholarships.gov.in/All-Scholarships",
        "title": "National Scholarship Portal — Post-Matric Scholarship for SC Students Guidelines",
        "publisher": "Ministry of Social Justice and Empowerment, Govt of India",
        "source_tier": 1,
        "doc_type": "notification",
        "verification_status": "VERIFIED",
        "last_verified_at": datetime(2026, 3, 20),
        "content_hash": "nsp-scholarship-2026-sha256-verified",
        "secondary_url": "https://scholarships.gov.in/scholarshipEligibility/",
    },
    "src-rythu": {
        "id": "a5000000-0000-0000-0000-000000000005",
        "url": "https://rythubharosa.telangana.gov.in/Default_Eng.aspx",
        "title": "Government of Telangana Rythu Bharosa Official Portal",
        "publisher": "Department of Agriculture, Government of Telangana",
        "source_tier": 1,
        "doc_type": "guideline",
        "verification_status": "VERIFIED",
        "last_verified_at": datetime(2026, 3, 20),
        "content_hash": "rythu-bharosa-guidelines-2026-sha256-verified",
        "secondary_url": "https://www.telangana.gov.in/",
    },
    "src-example-draft": {
        "id": "a6000000-0000-0000-0000-000000000006",
        "url": "https://example.gov.in/draft-guideline-2026.pdf",
        "title": "Draft Discussion Paper (Not Gazetted)",
        "publisher": "Unverified Example Publisher",
        "source_tier": 5,
        "doc_type": "draft",
        "verification_status": "UNVERIFIED_EXAMPLE",
        "last_verified_at": datetime(2026, 1, 1),
        "content_hash": "unverified-example-draft-hash",
    },
}

_DEMO_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "b1000000-0000-0000-0000-000000000001",
        "slug": "pm-kisan",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "category": "agriculture",
        "level": "CENTRAL",
        "state": None,
        "department": "Ministry of Agriculture and Farmers Welfare, Govt of India",
        "description": (
            "Centrally sponsored income support of ₹6,000 per year in three equal installments of ₹2,000 "
            "directly via DBT to all landholding farmer families across the country, irrespective of landholding size "
            "(the initial 2-hectare ceiling was abolished under revised guidelines), subject to statutory exclusion criteria."
        ),
        "active": True,
        "verification_status": "VERIFIED",
        "source_key": "src-pm-kisan",
        "criteria": [
            {
                "id": "c1100000-0000-0000-0000-000000000001",
                "criterion_key": "occupation",
                "operator": "==",
                "value": {"v": "farmer"},
                "required": True,
                "source_ref": "Clause 2.1: Landholder Farmer Families",
                "description": "Beneficiary must be a practicing landholding farmer family (husband, wife, and minor children owning cultivable land).",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000002",
                "criterion_key": "landholding_acres",
                "operator": ">",
                "value": {"v": 0.0},
                "required": True,
                "source_ref": "Clause 2.2: Cultivable land ownership (No 2-Hectare Ceiling)",
                "description": "Must possess cultivable agricultural land registered in state revenue records. (The 2-hectare ceiling was abolished under revised guidelines).",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000003",
                "criterion_key": "is_institutional_landholder",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(a): Institutional Landholders Exclusion",
                "description": "All institutional landholders are ineligible for PM-KISAN benefit.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000004",
                "criterion_key": "has_constitutional_post_holder",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(b)(i): Former and present holders of constitutional posts",
                "description": "Farmer families in which any member holds or held a constitutional post are excluded.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000005",
                "criterion_key": "has_specified_elected_representative",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(b)(ii): Specified Elected Representatives Exclusion",
                "description": "Farmer families with former/present Ministers, MPs, MLAs, MLCs, Mayors, or District Panchayat Chairpersons are excluded.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000006",
                "criterion_key": "is_government_employee_non_mts",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(b)(iii): Government Employees (Excluding Class IV / MTS)",
                "description": "Serving or retired regular government employees are excluded, EXCEPT Multi-Tasking Staff / Class IV / Group D employees who are explicitly exempt.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000007",
                "criterion_key": "has_pensioner_above_10k_non_mts",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(b)(iv): Pensioners with ₹10,000+ monthly pension (Excluding Class IV / MTS)",
                "description": "Retired pensioners whose monthly pension is ₹10,000 or more are excluded, EXCEPT Multi-Tasking Staff / Class IV / Group D pensioners.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000008",
                "criterion_key": "is_income_tax_payee",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(b)(v): Income Tax Exclusion",
                "description": "Persons who paid income tax in the last assessment year (or whose family member paid tax) are excluded.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000009",
                "criterion_key": "has_practicing_professional",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Clause 3(b)(vi): Registered Practicing Professionals Exclusion",
                "description": "Professionals like Doctors, Engineers, Lawyers, Chartered Accountants, and Architects registered with professional bodies and undertaking active practice are excluded.",
            },
            {
                "id": "c1100000-0000-0000-0000-000000000010",
                "criterion_key": "is_nri_or_foreign_resident",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Statutory Landholder Operational Guidelines: Domestic Resident Requirement",
                "description": "Non-Resident Indians (NRIs) and foreign residents are ineligible for PM-KISAN benefit.",
            },
        ],
        "documents": [
            {
                "kind": "identity",
                "name": "Aadhaar Card",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Required for mandatory e-KYC and identity verification under Clause 3.",
            },
            {
                "kind": "land_record",
                "name": "Land Ownership Record (Khata/RoR/Pattadar Passbook)",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Proves legal ownership of agricultural land in state revenue records.",
            },
            {
                "kind": "banking",
                "name": "Aadhaar-seeded Bank Account Passbook",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Required for Direct Benefit Transfer (DBT) installment credits via PFMS.",
            },
        ],
        "evidence_chunks": [
            {
                "id": "e1100000-0000-0000-0000-000000000001",
                "source_key": "src-pm-kisan",
                "chunk_index": 0,
                "text": (
                    "All landholding farmer families in the country are eligible to "
                    "receive income support of Rs.6000/- per year. This income support "
                    "will be transferred in three equal installments of Rs.2000/- each "
                    "every four months directly via DBT. The initial 2-hectare ceiling has been "
                    "abolished under expanded operational guidelines. (PM-KISAN Operational Guidelines, Clause 2.1)"
                ),
                "section_ref": "Clause 2.1",
                "page_ref": "p.3",
            },
            {
                "id": "e1100000-0000-0000-0000-000000000002",
                "source_key": "src-pm-kisan",
                "chunk_index": 1,
                "text": (
                    "A farmer family is defined as a family comprising of husband, wife "
                    "and minor children who own cultivable land as per land records of "
                    "the concerned State/UT. (PM-KISAN Operational Guidelines, Clause 2.2)"
                ),
                "section_ref": "Clause 2.2",
                "page_ref": "p.3",
            },
            {
                "id": "e1100000-0000-0000-0000-000000000003",
                "source_key": "src-pm-kisan",
                "chunk_index": 2,
                "text": (
                    "The following categories of beneficiaries of higher economic status shall not be eligible: "
                    "Institutional landholders, constitutional post holders, serving/retired government officers and "
                    "employees (except Class IV/Group D), pensioners earning Rs.10,000+ monthly, income tax payees, "
                    "and registered professionals (Doctors, Engineers, Lawyers, CAs). (PM-KISAN Guidelines, Clause 3 Exclusions)"
                ),
                "section_ref": "Clause 3",
                "page_ref": "p.4",
            },
        ],
    },
    {
        "id": "b2000000-0000-0000-0000-000000000002",
        "slug": "pm-jay",
        "name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
        "category": "healthcare",
        "level": "CENTRAL",
        "state": None,
        "department": "National Health Authority, Govt of India",
        "description": (
            "Health cover of ₹5,00,000 per family per year on family floater basis for secondary and tertiary "
            "care hospitalization to bottom 40% vulnerable families based on SECC 2011 deprivation criteria, "
            "AND universal ₹5 Lakh coverage to all senior citizens aged 70 and above irrespective of socio-economic status or income. "
            "100% cashless hospitalization at empaneled hospitals across India (no bank account or DBT required)."
        ),
        "active": True,
        "verification_status": "VERIFIED",
        "source_key": "src-pm-jay",
        "criteria": [
            {
                "id": "c2200000-0000-0000-0000-000000000001",
                "criterion_key": "age",
                "operator": ">=",
                "value": {"v": 70},
                "required": True,
                "pathway": "senior_70_plus",
                "source_ref": "NHA AB PM-JAY Senior Citizen Expansion Guidelines (2024)",
                "description": "Universal health coverage of ₹5 Lakh for all senior citizens aged 70 years and above irrespective of socio-economic status or income.",
            },
            {
                "id": "c2200000-0000-0000-0000-000000000002",
                "criterion_key": "annual_income_inr",
                "operator": "<=",
                "value": {"v": 250000},
                "required": True,
                "pathway": "vulnerable_household",
                "source_ref": "SECC Deprivation D1-D7 Criteria Proxy Threshold",
                "description": "Household annual income must not exceed ₹2,50,000 (proxy for SECC 2011 deprivation threshold).",
            },
            {
                "id": "c2200000-0000-0000-0000-000000000003",
                "criterion_key": "category",
                "operator": "IN",
                "value": {"v": ["SC", "ST", "OBC", "EWS"]},
                "required": True,
                "pathway": "vulnerable_household",
                "source_ref": "Clause 3: Target Social Beneficiaries",
                "description": "Belongs to economically deprived social category covered under SECC/NFSA entitlement database.",
            },
            {
                "id": "c2200000-0000-0000-0000-000000000004",
                "criterion_key": "pmjay_eligible_category",
                "operator": "==",
                "value": {"v": True},
                "required": True,
                "pathway": "vulnerable_household",
                "source_ref": "NHA AB PM-JAY Operational Guidelines: 11 Notified Urban Occupational Categories & SECC Criteria",
                "description": (
                    "Must belong to an evidence-backed eligible occupational category (e.g. sanitation, construction, "
                    "transport, domestic worker, street vendor) or verified SECC/NFSA deprivation record. Low income "
                    "or generic daily-wage occupation alone is not sufficient proof and requires verification."
                ),
            },
        ],
        "documents": [
            {
                "kind": "identity",
                "name": "Aadhaar Card or Alternative Government Photo ID (Voter ID / Ration Card)",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Any valid government photo ID is accepted for Ayushman Card generation; Aadhaar is preferred but alternative photo IDs are permitted.",
            },
            {
                "kind": "ration_card",
                "name": "Ration Card / SECC Household Registration Slip / Age Proof",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Verifies family inclusion in SECC 2011 / NFSA eligible database, or age 70+ identity for the senior citizen pathway.",
            },
            {
                "kind": "banking",
                "name": "Bank Account Details",
                "required": False,
                "requirement_type": "NOT_APPLICABLE",
                "description": "Not required — PM-JAY is a 100% cashless hospitalization scheme (no direct bank cash transfer or DBT needed).",
            },
        ],
        "evidence_chunks": [
            {
                "id": "e2200000-0000-0000-0000-000000000001",
                "source_key": "src-pm-jay",
                "chunk_index": 0,
                "text": (
                    "AB-PMJAY covers over 12 crore poor and vulnerable families (approximately 55 crore beneficiaries), "
                    "based on Socio-Economic Caste Census (SECC) 2011 deprivation criteria, with health cover of Rs.5 lakh "
                    "per family per year. Hospital services are 100% cashless across all empaneled public and private healthcare providers. "
                    "(PM-JAY Eligibility Framework, Section 2)"
                ),
                "section_ref": "Section 2",
                "page_ref": "p.1",
            },
            {
                "id": "e2200000-0000-0000-0000-000000000002",
                "source_key": "src-pm-jay",
                "chunk_index": 1,
                "text": (
                    "PM-JAY is completely cashless and paperless at the point of delivery. Beneficiaries are not required to "
                    "pay any deposit, nor is any bank account or cash subsidy required. The benefit is provided through the "
                    "Ayushman Golden Card generated upon identity authentication. (NHA Guidelines, Section 4)"
                ),
                "section_ref": "Section 4",
                "page_ref": "p.2",
            },
            {
                "id": "e2200000-0000-0000-0000-000000000003",
                "source_key": "src-pm-jay",
                "chunk_index": 2,
                "text": (
                    "Universal health coverage under AB PM-JAY has been extended to all senior citizens aged 70 years and above "
                    "across the country, irrespective of income or socio-economic category. A distinct Ayushman Vay Vandana card "
                    "is issued to provide a separate annual family floater health cover of Rs.5 lakh. (NHA Senior Citizen FAQs & Cabinet Decision)"
                ),
                "section_ref": "Senior Citizens Benefits FAQ",
                "page_ref": "p.1",
            },
        ],
    },
    {
        "id": "b3000000-0000-0000-0000-000000000003",
        "slug": "pmay-g",
        "name": "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
        "category": "housing",
        "level": "CENTRAL",
        "state": None,
        "department": "Ministry of Rural Development, Govt of India",
        "description": (
            "Financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly/difficult areas for construction of pucca house "
            "to rural houseless families and families living in 0, 1 or 2 rooms with kutcha wall and kutcha roof, plus MGNREGA "
            "labor convergence and SBM toilet grant, subject to the official 15-question eligibility and exclusion framework."
        ),
        "active": True,
        "verification_status": "VERIFIED",
        "source_key": "src-pmay-g",
        "criteria": [
            {
                "id": "c3300000-0000-0000-0000-000000000001",
                "criterion_key": "residence_area",
                "operator": "==",
                "value": {"v": "rural"},
                "required": True,
                "source_ref": "Questionnaire Q2: Rural Residence Mandate",
                "description": "Household must reside in a rural Gram Panchayat area.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000002",
                "criterion_key": "owns_pucca_house",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q3: Pucca House Ownership Exclusion",
                "description": "Household must not own a permanent pucca house; pucca house ownership is an exclusion.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000003",
                "criterion_key": "lives_in_kutcha_house",
                "operator": "==",
                "value": {"v": True},
                "required": True,
                "source_ref": "Questionnaire Q4: Kutcha House or Houseless Condition",
                "description": "Household must reside in a kutcha house or be houseless.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000004",
                "criterion_key": "has_more_than_two_pucca_rooms",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q5: Room Count Ceiling",
                "description": "Household must not have more than 2 pucca rooms with permanent roof.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000005",
                "criterion_key": "has_motorized_vehicle",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q6 / Exclusion 1: Motorized Vehicle",
                "description": "Ownership of motorized two/three/four wheelers or motorized fishing boats is an exclusion.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000006",
                "criterion_key": "has_mechanized_agri_equipment",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q7 / Exclusion 2: Mechanized Agricultural Equipment",
                "description": "Ownership of mechanized three/four wheeler agricultural equipment is an exclusion.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000007",
                "criterion_key": "has_kcc_above_50k",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q8 / Exclusion 3: Kisan Credit Card Limit",
                "description": "Possession of Kisan Credit Card with credit limit of ₹50,000 or above is an exclusion.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000008",
                "criterion_key": "is_government_employee",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q9 / Exclusion 4: Government Employment",
                "description": "Households with any member as a regular government employee are excluded.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000009",
                "criterion_key": "has_registered_non_agri_enterprise",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q10 / Exclusion 5: Registered Non-Agri Enterprise",
                "description": "Households with government-registered non-agricultural enterprises are excluded.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000010",
                "criterion_key": "earns_above_15k_monthly",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q11 / Exclusion 6: Monthly Earning > ₹15,000",
                "description": "Households where any member earns more than ₹15,000 per month (₹1,80,000/year) are excluded.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000011",
                "criterion_key": "is_income_tax_payee",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q12 / Exclusion 7: Income Tax",
                "description": "Households paying income tax are excluded.",
            },
            {
                "id": "c3300000-0000-0000-0000-000000000012",
                "criterion_key": "pays_professional_tax",
                "operator": "==",
                "value": {"v": False},
                "required": True,
                "source_ref": "Questionnaire Q13 / Exclusion 8: Professional Tax",
                "description": "Households paying professional tax are excluded.",
            },
        ],
        "documents": [
            {
                "kind": "identity",
                "name": "Aadhaar Card",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Identity verification for adult household beneficiaries.",
            },
            {
                "kind": "residence",
                "name": "Land/House Site Certificate or Gram Panchayat Consent",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Proves legal possession of rural site for pucca house construction.",
            },
            {
                "kind": "employment",
                "name": "MGNREGA Job Card",
                "required": False,
                "requirement_type": "CONDITIONALLY_REQUIRED",
                "description": "Required for convergence of 90/95 days unskilled construction labor wages.",
            },
            {
                "kind": "banking",
                "name": "Aadhaar-linked Bank Account Passbook",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "For DBT disbursal of construction milestone tranches upon geo-tagged inspection.",
            },
        ],
        "evidence_chunks": [
            {
                "id": "e3300000-0000-0000-0000-000000000001",
                "source_key": "src-pmay-g",
                "chunk_index": 0,
                "text": (
                    "Under PMAY-G, financial assistance of Rs.1.20 lakh in plain areas and Rs.1.30 lakh in hilly/difficult "
                    "areas is provided for construction of pucca house to rural houseless households and those living in "
                    "zero, one or two rooms with kutcha wall and kutcha roof. Beneficiary identification is verified through "
                    "the Gram Panchayat Awaas+ list. (PMAY-G Framework, Chapter 2)"
                ),
                "section_ref": "Chapter 2",
                "page_ref": "p.5",
            },
            {
                "id": "e3300000-0000-0000-0000-000000000002",
                "source_key": "src-pmay-g",
                "chunk_index": 1,
                "text": (
                    "Under the official PMAY-G questionnaire (netiayHome/questions.html Q1-Q15), households residing in rural areas living "
                    "in kutcha houses or houseless are eligible, provided they do not own a pucca house, do not have more than 2 pucca rooms, "
                    "do not own motorized 2/3/4 wheelers or mechanized agricultural equipment, have KCC limit under Rs.50,000, have no member as "
                    "government employee, have no registered non-agri enterprise, earn Rs.15,000 or less per month, and pay neither income nor "
                    "professional tax. (PMAY-G Eligibility Questionnaire Q1-Q15)"
                ),
                "section_ref": "Questionnaire Q1-Q15",
                "page_ref": "p.1",
            },
        ],
    },
    {
        "id": "b4000000-0000-0000-0000-000000000004",
        "slug": "nsp-post-matric",
        "name": "Post-Matric Scholarship for SC Students",
        "category": "education",
        "level": "CENTRAL",
        "state": None,
        "department": "Ministry of Social Justice and Empowerment, Govt of India",
        "description": (
            "Centrally Sponsored Post-Matric Scholarship Scheme for SC Students studying in recognized post-matriculation or "
            "post-secondary courses with parental annual income up to ₹2,50,000, covering tuition reimbursement and maintenance allowance."
        ),
        "active": True,
        "verification_status": "VERIFIED",
        "source_key": "src-nsp",
        "criteria": [
            {
                "id": "c4400000-0000-0000-0000-000000000001",
                "criterion_key": "category",
                "operator": "==",
                "value": {"v": "SC"},
                "required": True,
                "source_ref": "Clause 1.2: Eligibility Category",
                "description": "Student must belong to Scheduled Caste (SC) community.",
            },
            {
                "id": "c4400000-0000-0000-0000-000000000002",
                "criterion_key": "annual_income_inr",
                "operator": "<=",
                "value": {"v": 250000},
                "required": True,
                "source_ref": "Clause 2.4: Family Income Ceiling",
                "description": "Combined parental annual income must not exceed ₹2,50,000.",
            },
            {
                "id": "c4400000-0000-0000-0000-000000000003",
                "criterion_key": "education_level",
                "operator": "IN",
                "value": {"v": ["post-matric", "undergraduate", "postgraduate", "diploma", "doctorate"]},
                "required": True,
                "source_ref": "Clause 2.1: Recognized Post-Matriculation Course",
                "description": "Student must be enrolled in recognized post-matriculation or post-secondary courses.",
            },
        ],
        "documents": [
            {
                "kind": "caste",
                "name": "Caste Certificate (SC) issued by Revenue Authority",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "SC certificate issued by authorized Revenue Authority (Tahsildar/SDM).",
            },
            {
                "kind": "income",
                "name": "Income Certificate for Current Financial Year",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Proves annual parental/family income is within ₹2,50,000 ceiling.",
            },
            {
                "kind": "educational",
                "name": "Class 10 / Matriculation Passing Certificate",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Verifies qualifying matriculation completion for post-secondary study.",
            },
            {
                "kind": "bonafide",
                "name": "Bonafide Student Certificate / College Admission Receipt",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Issued by registered college/institution verifying regular enrollment.",
            },
            {
                "kind": "banking",
                "name": "Aadhaar-seeded Student Bank Account",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Bank account in applicant's name for direct scholarship credit via PFMS.",
            },
        ],
        "evidence_chunks": [
            {
                "id": "e4400000-0000-0000-0000-000000000001",
                "source_key": "src-nsp",
                "chunk_index": 0,
                "text": (
                    "Post-Matric Scholarship for SC Students provides financial assistance to Scheduled Caste students "
                    "studying at post-matriculation or post-secondary stages in recognized institutions, provided the combined annual income "
                    "of parents/guardians from all sources does not exceed Rs.2,50,000/-. (NSP PMS-SC Scheme Guidelines, Section 2.1)"
                ),
                "section_ref": "Section 2.1",
                "page_ref": "p.2",
            },
            {
                "id": "e4400000-0000-0000-0000-000000000002",
                "source_key": "src-nsp",
                "chunk_index": 1,
                "text": (
                    "Applications are processed via the National Scholarship Portal (scholarships.gov.in) with One-Time Registration (OTR). "
                    "Institutions perform Level-1 bonafide student verification before state nodal officer approval and DBT credit via PFMS. "
                    "(NSP Operational Manual, Section 3.2)"
                ),
                "section_ref": "Section 3.2",
                "page_ref": "p.4",
            },
        ],
    },
    {
        "id": "b5000000-0000-0000-0000-000000000005",
        "slug": "rythu-bharosa",
        "name": "Rythu Bharosa (Telangana Agriculture Investment Support)",
        "category": "agriculture",
        "level": "STATE",
        "state": "TS",
        "department": "Department of Agriculture, Govt of Telangana",
        "description": (
            "Agricultural investment assistance of ₹12,000 per acre annually (₹6,000 per acre per season for Kharif and Rabi) "
            "provided by the Government of Telangana to landholding farmers possessing digital Pattadar Passbooks for the purchase "
            "of farming inputs (enhanced from former Rythu Bandhu)."
        ),
        "active": True,
        "verification_status": "VERIFIED",
        "source_key": "src-rythu",
        "criteria": [
            {
                "id": "c5500000-0000-0000-0000-000000000001",
                "criterion_key": "state",
                "operator": "==",
                "value": {"v": "TS"},
                "required": True,
                "source_ref": "Section 1: State Domicile Requirement",
                "description": "Landholding must be located in Telangana state.",
            },
            {
                "id": "c5500000-0000-0000-0000-000000000002",
                "criterion_key": "occupation",
                "operator": "==",
                "value": {"v": "farmer"},
                "required": True,
                "source_ref": "Section 2: Active Cultivator Status",
                "description": "Beneficiary must be an active landholder farmer cultivating land.",
            },
            {
                "id": "c5500000-0000-0000-0000-000000000003",
                "criterion_key": "landholding_acres",
                "operator": ">",
                "value": {"v": 0.0},
                "required": True,
                "source_ref": "Section 2: Pattadar Passbook Holder",
                "description": "Farmer must possess recorded cultivable agricultural land with digital Pattadar Passbook.",
            },
        ],
        "documents": [
            {
                "kind": "land_record",
                "name": "Telangana Pattadar Passbook (Dharani/CCLA Portal)",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Digital record with Pattadar Passbook (PPB) number and recorded survey numbers.",
            },
            {
                "kind": "identity",
                "name": "Aadhaar Card of Landholder",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Identity verification linked to the digital land title.",
            },
            {
                "kind": "banking",
                "name": "Bank Account Passbook",
                "required": True,
                "requirement_type": "MANDATORY",
                "description": "Account linked to Pattadar passbook for seasonal input subsidy credits.",
            },
        ],
        "evidence_chunks": [
            {
                "id": "e5500000-0000-0000-0000-000000000001",
                "source_key": "src-rythu",
                "chunk_index": 0,
                "text": (
                    "Under the Rythu Bharosa programme, the Government of Telangana provides input assistance of Rs.12,000 per acre "
                    "annually (Rs.6,000 per season for Kharif and Rabi) to eligible pattadar farmers possessing verified digital agricultural "
                    "land titles recorded on the Dharani/CCLA revenue portal. (Government of Telangana Agriculture Policy Guidelines, Section 2)"
                ),
                "section_ref": "Section 2",
                "page_ref": "p.1",
            },
            {
                "id": "e5500000-0000-0000-0000-000000000002",
                "source_key": "src-rythu",
                "chunk_index": 1,
                "text": (
                    "The investment support is transferred directly into the bank accounts of pattadar farmers possessing "
                    "recorded cultivable lands. The scheme replaces the erstwhile Rythu Bandhu with enhanced per-acre support. "
                    "(Telangana Agriculture Guidelines, Section 3)"
                ),
                "section_ref": "Section 3",
                "page_ref": "p.2",
            },
        ],
    },
    {
        "id": "b6000000-0000-0000-0000-000000000006",
        "slug": "example-draft-scheme",
        "name": "Example Draft Skill Development Scheme (Testing Fixture)",
        "category": "skills",
        "level": "CENTRAL",
        "state": None,
        "department": "Ministry of Skill Development (Unverified Draft)",
        "description": "Unverified test fixture used to ensure seed loading and rules engine refuse to present unverified criteria as verified.",
        "active": False,
        "verification_status": "UNVERIFIED_EXAMPLE",
        "source_key": "src-example-draft",
        "criteria": [
            {
                "id": "c6600000-0000-0000-0000-000000000001",
                "criterion_key": "age",
                "operator": "BETWEEN",
                "value": {"v": [18, 35]},
                "required": True,
                "source_ref": "UNVERIFIED_FIXTURE_ONLY",
                "description": "Candidate age between 18 and 35 (Unverified example fixture).",
            },
        ],
        "documents": [
            {
                "kind": "identity",
                "name": "Age Proof Document",
                "required": True,
                "requirement_type": "UNVERIFIED",
                "description": "Unverified testing document fixture.",
            },
        ],
        "evidence_chunks": [
            {
                "id": "e6600000-0000-0000-0000-000000000001",
                "source_key": "src-example-draft",
                "chunk_index": 0,
                "text": "Draft discussion paper for testing unverified fixture handling. (Not Gazetted Policy)",
                "section_ref": "Draft Discussion",
                "page_ref": "p.1",
            },
        ],
    },
]


class DemoRepository:
    """In-memory demo repository — no database required.

    All data is loaded at module import time from the constants above.
    This ensures the application is fully demonstrable without PostgreSQL.
    """

    def __init__(self) -> None:
        # Build lookup indexes
        self._schemes_by_id: Dict[str, Dict] = {s["id"]: s for s in _DEMO_SCHEMES}
        self._schemes_by_slug: Dict[str, Dict] = {s["slug"]: s for s in _DEMO_SCHEMES}
        # Backward compatibility alias for rythu-bandhu
        if "rythu-bharosa" in self._schemes_by_slug:
            self._schemes_by_slug["rythu-bandhu"] = self._schemes_by_slug["rythu-bharosa"]
        self._sources: Dict[str, Dict] = _DEMO_SOURCES

    # ------------------------------------------------------------------
    # Scheme operations
    # ------------------------------------------------------------------

    def list_schemes(
        self,
        category: Optional[str] = None,
        level: Optional[str] = None,
        state: Optional[str] = None,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        results = []
        for s in _DEMO_SCHEMES:
            if active_only and not s.get("active", True):
                continue
            if category and s.get("category", "").lower() != category.lower():
                continue
            if level and s.get("level", "").upper() != level.upper():
                continue
            if state and s.get("state") and s["state"].upper() != state.upper():
                continue
            results.append(self._enrich_scheme(s))
        return results

    def get_scheme(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        s = self._schemes_by_id.get(scheme_id)
        if not s:
            # try slug
            s = self._schemes_by_slug.get(scheme_id)
        if not s:
            return None
        return self._enrich_scheme(s)

    def get_scheme_criteria(self, scheme_id: str) -> List[Dict[str, Any]]:
        s = self._schemes_by_id.get(scheme_id) or self._schemes_by_slug.get(scheme_id)
        if not s:
            return []
        return list(s.get("criteria", []))

    def get_scheme_documents(self, scheme_id: str) -> List[Dict[str, Any]]:
        s = self._schemes_by_id.get(scheme_id) or self._schemes_by_slug.get(scheme_id)
        if not s:
            return []
        return list(s.get("documents", []))

    def _enrich_scheme(self, s: Dict[str, Any]) -> Dict[str, Any]:
        """Return scheme with source metadata attached."""
        result = dict(s)
        source_key = s.get("source_key")
        if source_key and source_key in self._sources:
            result["source"] = self._sources[source_key]
        return result

    # ------------------------------------------------------------------
    # Source operations
    # ------------------------------------------------------------------

    def list_sources(self) -> List[Dict[str, Any]]:
        return list(self._sources.values())

    def get_source(self, source_id: str) -> Optional[Dict[str, Any]]:
        for src in self._sources.values():
            if src["id"] == source_id:
                return src
        return None

    # ------------------------------------------------------------------
    # Evidence / Retrieval (lexical fallback — clearly not embedding search)
    # ------------------------------------------------------------------

    def search_evidence(
        self,
        query: str,
        scheme_id: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Lexical keyword search over evidence chunks.

        NOTE: This is a lexical keyword match, NOT semantic embedding search.
        It is used only in demo mode when pgvector is unavailable.
        """
        results = []
        query_lower = query.lower()
        query_tokens = set(query_lower.split())

        for scheme in _DEMO_SCHEMES:
            if scheme_id and scheme["id"] != scheme_id and scheme["slug"] != scheme_id:
                continue
            source_key = scheme.get("source_key", "")
            source = self._sources.get(source_key, {})

            for chunk in scheme.get("evidence_chunks", []):
                text_lower = chunk["text"].lower()
                # Score: count matching tokens
                score = sum(1 for t in query_tokens if t in text_lower)
                if score > 0 or not query_tokens:
                    results.append(
                        {
                            "id": chunk["id"],
                            "source_id": source.get("id", ""),
                            "source_title": source.get("title", ""),
                            "source_url": source.get("url", ""),
                            "source_tier": source.get("source_tier", 3),
                            "quote": chunk["text"],
                            "page_ref": chunk.get("page_ref"),
                            "section_ref": chunk.get("section_ref"),
                            "last_verified_at": source.get("last_verified_at"),
                            "verification_status": source.get("verification_status", "VERIFIED"),
                            "_score": score,
                        }
                    )

        results.sort(key=lambda x: x["_score"], reverse=True)
        for r in results:
            r.pop("_score", None)
        return results[:top_k]

    # ------------------------------------------------------------------
    # Profile session (ephemeral, in-memory only)
    # ------------------------------------------------------------------

    def create_session(self) -> str:
        """Returns a new ephemeral session ID. Nothing persisted."""
        return str(uuid.uuid4())

    # ------------------------------------------------------------------
    # Discovery — keyword + category match
    # ------------------------------------------------------------------

    def discover_schemes(
        self,
        profile: Dict[str, Any],
        goal: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Returns schemes potentially relevant to the citizen profile.

        Uses keyword/category matching in demo mode.
        This is NOT semantic search; it is clearly labelled as category-based matching.
        """
        occupation = (profile.get("occupation") or "").lower()
        state = (profile.get("state") or "").upper()
        category = (profile.get("category") or "").upper()
        goal_lower = (goal or "").lower()

        candidates = []
        for scheme in _DEMO_SCHEMES:
            if not scheme.get("active", True):
                continue

            score = 0
            rationale_parts = []

            # State relevance
            s_state = scheme.get("state")
            if s_state is not None and state and s_state.upper() != state:
                # State mismatch for state-specific scheme
                continue

            if s_state is None:
                score += 1
                rationale_parts.append("Central scheme applicable nationwide")
            elif state and s_state.upper() == state:
                score += 3
                rationale_parts.append(f"State-level scheme for your state ({s_state})")

            # Category relevance from occupation or goal
            cat = scheme.get("category", "")
            if "farm" in occupation or "agri" in goal_lower:
                if cat == "agriculture":
                    score += 3
                    rationale_parts.append("Matches your farming occupation")
            if "health" in goal_lower or "medical" in goal_lower:
                if cat == "healthcare":
                    score += 3
                    rationale_parts.append("Matches your healthcare goal")
            if "hous" in goal_lower or "home" in goal_lower:
                if cat == "housing":
                    score += 3
                    rationale_parts.append("Matches your housing goal")
            if "student" in occupation or "study" in goal_lower or "educat" in goal_lower or "scholarship" in goal_lower:
                if cat == "education":
                    score += 3
                    rationale_parts.append("Matches your student/education profile")

            # Social category
            if category in ["SC", "ST"] and cat in ["education", "healthcare"]:
                score += 2
                rationale_parts.append(f"Schemes with SC/ST category priority ({category})")

            # If user provided explicit occupation or goal, only keep schemes matching that domain
            has_explicit_intent = bool(occupation or goal_lower)
            has_domain_match = any("Matches" in r for r in rationale_parts)
            if has_explicit_intent and not has_domain_match:
                continue

            candidates.append(
                {
                    **self._enrich_scheme(scheme),
                    "relevance_score": score,
                    "relevance_rationale": "; ".join(rationale_parts)
                    if rationale_parts
                    else "General eligibility screening",
                    "retrieval_mode": "lexical_category_match",
                }
            )

        candidates.sort(key=lambda x: x["relevance_score"], reverse=True)
        return candidates


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------
_demo_repo: Optional[DemoRepository] = None


def get_demo_repo() -> DemoRepository:
    global _demo_repo
    if _demo_repo is None:
        _demo_repo = DemoRepository()
    return _demo_repo
