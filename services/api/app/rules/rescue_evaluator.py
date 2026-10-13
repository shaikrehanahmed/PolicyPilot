"""Deterministic Application Defect & Recovery Evaluator.

Upholds .agents/skills/policypilot-guardrails/SKILL.md:
1. Zero LLM reliance for defect classification, trap warnings, or eligibility.
2. Uses evaluate_scheme_eligibility() from evaluator.py for No-Dead-End routing.
3. Enforces 180-day STALE source detection and XML <evidence> delimiters.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..demo.repository import get_demo_repo
from ..schemas.common import EligibilityStatus, VerificationStatus
from ..schemas.rescue import (
    AlternativeSchemeOption,
    ClarificationOption,
    ClarificationQuestion,
    GuardrailCitationOut,
    RescuePresetOut,
)
from .evaluator import evaluate_scheme_eligibility

# Matches 8 to 16 digits (even with spaces or hyphens) and emails for zero-PII intake
_SENSITIVE_NUMBER_RE = re.compile(r"\b(?:\d[\s-]?){7,15}\d\b")
_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")


def scrub_sensitive_input(raw_text: str) -> str:
    """Deterministically masks sensitive numeric sequences and emails before processing."""
    if not raw_text:
        return ""
    cleaned = _EMAIL_RE.sub("[REDACTED_EMAIL]", raw_text)
    cleaned = _SENSITIVE_NUMBER_RE.sub("[REDACTED_ID_NUMBER]", cleaned)
    return cleaned.strip()


def compute_freshness_status(verified_dt: datetime, now: Optional[datetime] = None) -> VerificationStatus:
    """Flags source as STALE if last_verified_at is > 180 days ago per SKILL.md Section 2."""
    ref_now = now or datetime.now(timezone.utc)
    if verified_dt.tzinfo is None:
        verified_dt = verified_dt.replace(tzinfo=timezone.utc)
    if ref_now.tzinfo is None:
        ref_now = ref_now.replace(tzinfo=timezone.utc)
    age_days = (ref_now - verified_dt).days
    return VerificationStatus.STALE if age_days > 180 else VerificationStatus.VERIFIED


def format_guardrail_citation(
    source_id: str,
    source_title: str,
    source_url: str,
    quote: str,
    last_verified_at: datetime,
    source_tier: int = 1,
    section_ref: Optional[str] = None,
    now: Optional[datetime] = None,
) -> GuardrailCitationOut:
    """Builds a SKILL.md-compliant citation with XML prompt-injection delimiters."""
    freshness = compute_freshness_status(last_verified_at, now=now)
    iso_str = (
        last_verified_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        if last_verified_at.tzinfo is None
        else last_verified_at.isoformat()
    )
    xml_chunk = f'<evidence source_id="{source_id}">{quote}</evidence>'
    return GuardrailCitationOut(
        quote=quote,
        source_id=source_id,
        source_title=source_title,
        source_url=source_url,
        source_tier=source_tier,
        section_ref=section_ref,
        last_verified_at=iso_str,
        freshness_status=freshness,
        xml_delimited_chunk=xml_chunk,
    )


# ---------------------------------------------------------------------------
# Canonical Demo Presets & Defect Rules (Aligned with repository.py slugs)
# ---------------------------------------------------------------------------
RESCUE_PRESETS: List[RescuePresetOut] = [
    RescuePresetOut(
        preset_id="R1_NSP_OTR_TRAP",
        label="NSP Scholarship: Marked Defective by INO (Basic Info / Name Mismatch)",
        scheme_slug="nsp-post-matric",
        symptom_code="NSP_DEFECT_BASIC_INFO_MISMATCH",
        sample_status_text="Application marked Defective by INO: Father name spelling mismatch with income certificate",
        suggested_profile={
            "state": "TS",
            "occupation": "student",
            "category": "SC",
            "annual_income_inr": 140000,
            "education_level": "undergraduate",
        },
    ),
    RescuePresetOut(
        preset_id="R2_PMKISAN_NPCI_REJECTED",
        label="PM-KISAN: FTO Processed = Yes, PFMS Rejected by Bank (Mapper Inactive)",
        scheme_slug="pm-kisan",
        symptom_code="PMKISAN_PFMS_BANK_MAPPER_INACTIVE",
        sample_status_text="FTO Processed: Yes, Payment Status: PFMS Rejected by Bank - Account or NPCI Mapper Inactive",
        suggested_profile={
            "state": "TS",
            "occupation": "farmer",
            "landholding_acres": 2.5,
            "annual_income_inr": 90000,
        },
    ),
    RescuePresetOut(
        preset_id="R3_PMKISAN_QUEUE_WAIT",
        label="PM-KISAN: FTO Generated, PFMS Response Pending",
        scheme_slug="pm-kisan",
        symptom_code="PMKISAN_PFMS_RESPONSE_PENDING",
        sample_status_text="FTO Generated, PFMS Response Pending for bank account validation",
        suggested_profile={
            "state": "TS",
            "occupation": "farmer",
            "landholding_acres": 2.0,
        },
    ),
    RescuePresetOut(
        preset_id="R4_PMKISAN_LAND_EXCLUSION",
        label="PM-KISAN Rejected: No Cultivable Land -> No-Dead-End Pivot",
        scheme_slug="pm-kisan",
        symptom_code="PMKISAN_SUBSTANTIVE_LAND_EXCLUSION",
        sample_status_text="PM-KISAN Application Rejected: Applicant does not own cultivable land in state revenue records",
        suggested_profile={
            "state": "TS",
            "age": 42,
            "occupation": "construction worker",
            "category": "SC",
            "annual_income_inr": 95000,
            "landholding_acres": 0.0,
            "residence_area": "rural",
            "owns_pucca_house": False,
            "lives_in_kutcha_house": True,
            "has_more_than_two_pucca_rooms": False,
            "has_motorized_vehicle": False,
            "has_mechanized_agri_equipment": False,
            "has_kcc_above_50k": False,
            "is_government_employee": False,
            "has_registered_non_agri_enterprise": False,
            "earns_above_15k_monthly": False,
            "is_income_tax_payee": False,
            "pays_professional_tax": False,
        },
    ),
    RescuePresetOut(
        preset_id="R5_RYTHU_DHARANI_MISMATCH",
        label="Rythu Bharosa: Pattadar Passbook / MeeSeva Name Mismatch",
        scheme_slug="rythu-bharosa",
        symptom_code="RYTHU_PASSBOOK_NAME_MISMATCH",
        sample_status_text="DBT Hold: Pattadar Passbook name mismatch with bank account record on Dharani/CCLA portal",
        suggested_profile={
            "state": "TS",
            "occupation": "farmer",
            "landholding_acres": 1.5,
        },
    ),
]


DEFECT_RULES_REGISTRY: Dict[str, Dict[str, Any]] = {
    "NSP_DEFECT_BASIC_INFO_MISMATCH": {
        "scheme_slug": "nsp-post-matric",
        "keywords": ["defective", "ino", "mismatch", "father name", "basic info", "otr", "nodal officer"],
        "questions": [
            ClarificationQuestion(
                fact_key="application_type",
                question_text="Is your National Scholarship Portal (NSP) application a Fresh application or a Renewal?",
                options=[
                    ClarificationOption(value="FRESH", label="Fresh Application"),
                    ClarificationOption(value="RENEWAL", label="Renewal Application"),
                ],
                why_this_matters=(
                    "Under NSP User Manual v2.2 (Page 4), withdrawing a Fresh application is irreversible "
                    "(cannot be revoked), whereas Renewal applications have conditional revocation."
                ),
            ),
            ClarificationQuestion(
                fact_key="active_applications_count",
                question_text="Do you have only 1 active application on NSP, or multiple duplicate applications?",
                options=[
                    ClarificationOption(value="ONE", label="Only 1 active application"),
                    ClarificationOption(value="MULTIPLE", label="More than 1 active application"),
                ],
                why_this_matters=(
                    "Refreshing updated OTR details into an existing application requires holding only one active application."
                ),
            ),
        ],
        "citation": {
            "source_id": "a4000000-0000-0000-0000-000000000004",
            "source_title": "National Scholarship Portal — FAQ & Application User Manual v2.2",
            "source_url": "https://scholarships.gov.in/public/FAQ/NSP_FAQsORApplicationUsermanul_V2.2.pdf",
            "source_tier": 1,
            "section_ref": "Page 4, Questions 6, 8, 11–13",
            "last_verified_at": datetime(2026, 9, 20),
            "quote": (
                "Please note that contact/basic details cannot be edited directly on the Application Form. "
                "Instead, you must update your details on OTR and then refresh the updated information into "
                "the Application Form... Fresh Application cannot be revoked once withdrawn."
            ),
        },
    },
    "PMKISAN_PFMS_BANK_MAPPER_INACTIVE": {
        "scheme_slug": "pm-kisan",
        "keywords": ["pfms rejected", "mapper inactive", "npci", "fto processed: yes", "bank rejected"],
        "questions": [
            ClarificationQuestion(
                fact_key="ekyc_completed",
                question_text="Does your PM-KISAN beneficiary dashboard show eKYC Status: YES?",
                options=[
                    ClarificationOption(value="YES", label="Yes, eKYC is completed"),
                    ClarificationOption(value="NO", label="No, eKYC is pending"),
                ],
                why_this_matters="Isolates whether the failure is strictly at the bank NPCI mapper desk or also requires portal eKYC.",
            )
        ],
        "citation": {
            "source_id": "a1000000-0000-0000-0000-000000000001",
            "source_title": "PM-KISAN Operational Guidelines & PFMS DBT Seeding Protocol",
            "source_url": "https://pmkisan.gov.in/",
            "source_tier": 1,
            "section_ref": "Clause 3 & PFMS DBT Seeding Protocol",
            "last_verified_at": datetime(2026, 9, 20),
            "quote": (
                "Direct Benefit Transfer (DBT) installment credits are routed exclusively via the NPCI mapper "
                "to the latest seeded active bank account. Regular ATM/branch transaction activity does not "
                "confirm active NPCI DBT mapping."
            ),
        },
    },
    "PMKISAN_PFMS_RESPONSE_PENDING": {
        "scheme_slug": "pm-kisan",
        "keywords": ["pfms response pending", "fto generated", "validation under process"],
        "questions": [
            ClarificationQuestion(
                fact_key="working_days_elapsed",
                question_text="How many working days has your status shown 'PFMS Response Pending'?",
                options=[
                    ClarificationOption(value="UNDER_5_DAYS", label="Less than 5 working days"),
                    ClarificationOption(value="OVER_10_DAYS", label="More than 10 working days"),
                ],
                why_this_matters="Standard PFMS batch account validation takes 2 to 5 working days without citizen intervention.",
            )
        ],
        "citation": {
            "source_id": "a1000000-0000-0000-0000-000000000001",
            "source_title": "PM-KISAN Official Scheme Portal & Operational Guidelines",
            "source_url": "https://pmkisan.gov.in/",
            "source_tier": 1,
            "section_ref": "Beneficiary Status Definitions — FTO & PFMS",
            "last_verified_at": datetime(2026, 9, 20),
            "quote": (
                "When Fund Transfer Order (FTO) is generated and PFMS response is pending, automated batch "
                "account validation between PFMS and the bank is in progress."
            ),
        },
    },
    "PMKISAN_SUBSTANTIVE_LAND_EXCLUSION": {
        "scheme_slug": "pm-kisan",
        "keywords": ["no cultivable land", "does not own cultivable land", "institutional landholder", "land exclusion"],
        "questions": [],
        "citation": {
            "source_id": "a1000000-0000-0000-0000-000000000001",
            "source_title": "PM-KISAN Official Scheme Portal & Operational Guidelines",
            "source_url": "https://pmkisan.gov.in/",
            "source_tier": 1,
            "section_ref": "Clause 2.1 & Clause 2.2: Landholder Farmer Families",
            "last_verified_at": datetime(2026, 9, 20),
            "quote": (
                "A farmer family is defined as a family comprising of husband, wife and minor children who "
                "own cultivable land as per land records of the concerned State/UT. (PM-KISAN Operational Guidelines, Clause 2.2)"
            ),
        },
    },
    "RYTHU_PASSBOOK_NAME_MISMATCH": {
        "scheme_slug": "rythu-bharosa",
        "keywords": ["pattadar", "dharani", "ccla", "rythu", "passbook name mismatch", "dbt hold"],
        "questions": [],
        "citation": {
            "source_id": "a5000000-0000-0000-0000-000000000005",
            "source_title": "Government of Telangana Rythu Bharosa Official Portal",
            "source_url": "https://rythubharosa.telangana.gov.in/Default_Eng.aspx",
            "source_tier": 1,
            "section_ref": "Section 2 & 3: Pattadar Passbook & Bank Linkage",
            "last_verified_at": datetime(2026, 9, 20),
            "quote": (
                "Under the Rythu Bharosa programme, input assistance is transferred directly into the bank "
                "accounts of pattadar farmers possessing verified digital agricultural land titles recorded on the Dharani/CCLA revenue portal."
            ),
        },
    },
}


def match_symptom_code_lexically(scrubbed_text: str, scheme_slug: Optional[str] = None) -> Optional[str]:
    """Deterministic lexical matcher over DEFECT_RULES_REGISTRY."""
    text_lower = scrubbed_text.lower()
    best_code: Optional[str] = None
    best_score = 0

    for code, rule in DEFECT_RULES_REGISTRY.items():
        score = sum(2 for kw in rule["keywords"] if kw in text_lower)
        if scheme_slug and rule["scheme_slug"] == scheme_slug and score > 0:
            score += 1
        if score > best_score:
            best_score = score
            best_code = code

    return best_code if best_score > 0 else None


def find_no_dead_end_alternatives(
    excluded_scheme_slug: str,
    normalized_profile: Dict[str, Any],
) -> List[AlternativeSchemeOption]:
    """Evaluates all other active verified schemes using evaluate_scheme_eligibility()."""
    repo = get_demo_repo()
    all_schemes = repo.list_schemes(active_only=True)
    alternatives: List[AlternativeSchemeOption] = []

    for scheme in all_schemes:
        slug = scheme.get("slug", "")
        if slug == excluded_scheme_slug:
            continue
        if scheme.get("verification_status") != "VERIFIED":
            continue

        criteria = repo.get_scheme_criteria(scheme["id"])
        assessment = evaluate_scheme_eligibility(scheme, criteria, normalized_profile)
        if assessment.overall_status in (
            EligibilityStatus.ELIGIBLE,
            EligibilityStatus.PARTIALLY_ELIGIBLE,
        ):
            alternatives.append(
                AlternativeSchemeOption(
                    scheme_id=scheme["id"],
                    scheme_slug=slug,
                    scheme_name=scheme["name"],
                    overall_status=assessment.overall_status,
                    why_this_result=assessment.why_this_result,
                    missing_profile_fields=assessment.missing_profile_fields,
                )
            )

    # Sort ELIGIBLE ahead of PARTIALLY_ELIGIBLE
    alternatives.sort(
        key=lambda x: 0 if x.overall_status == EligibilityStatus.ELIGIBLE else 1
    )
    return alternatives
