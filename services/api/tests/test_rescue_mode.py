from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.rules.rescue_evaluator import (
    compute_freshness_status,
    format_guardrail_citation,
    scrub_sensitive_input,
)
from app.schemas.common import EligibilityStatus, VerificationStatus
from app.schemas.rescue import TriageVerdictType

client = TestClient(app)


def test_pii_scrubber_masks_long_numbers_and_emails():
    # Dynamically construct a 12-digit and 14-digit sequence so no literal ID strings appear in source
    fake_id_seq = "9" * 12
    fake_bank_seq = "7" * 14
    raw = f"Marked Defective for ref {fake_id_seq} and bank {fake_bank_seq} email user@test.org"
    scrubbed = scrub_sensitive_input(raw)

    assert fake_id_seq not in scrubbed
    assert fake_bank_seq not in scrubbed
    assert "user@test.org" not in scrubbed
    assert "[REDACTED_ID_NUMBER]" in scrubbed
    assert "[REDACTED_EMAIL]" in scrubbed


def test_skill_md_citation_freshness_and_xml_delimiters():
    now = datetime(2026, 10, 14, tzinfo=timezone.utc)
    recent_dt = datetime(2026, 9, 20, tzinfo=timezone.utc)
    old_dt = datetime(2026, 1, 10, tzinfo=timezone.utc)

    assert compute_freshness_status(recent_dt, now=now) == VerificationStatus.VERIFIED
    assert compute_freshness_status(old_dt, now=now) == VerificationStatus.STALE

    cit = format_guardrail_citation(
        source_id="src-test-1",
        source_title="Official Test Manual",
        source_url="https://scholarships.gov.in/",
        quote="Fresh Application cannot be revoked once withdrawn.",
        last_verified_at=recent_dt,
        now=now,
    )
    assert cit.freshness_status == VerificationStatus.VERIFIED
    assert cit.xml_delimited_chunk.startswith('<evidence source_id="src-test-1">')
    assert cit.xml_delimited_chunk.endswith("</evidence>")


def test_nsp_fresh_vs_renewal_procedural_trap_guardrail():
    # Step 1: Without supplied_facts, endpoint must ask clarification questions
    res_clarify = client.post(
        "/api/v1/rescue/diagnose",
        json={
            "raw_status_text": "Application marked Defective by INO: Father name mismatch",
            "selected_symptom_code": "NSP_DEFECT_BASIC_INFO_MISMATCH",
            "supplied_facts": {},
        },
    )
    assert res_clarify.status_code == 200
    data_clarify = res_clarify.json()
    assert data_clarify["verdict"] == TriageVerdictType.NEEDS_CLARIFICATION.value
    assert len(data_clarify["clarification_questions"]) == 2

    # Step 2: With application_type = FRESH, must return PROCEDURAL_TRAP_WARNING blocking withdrawal
    res_fresh = client.post(
        "/api/v1/rescue/diagnose",
        json={
            "raw_status_text": "Application marked Defective by INO: Father name mismatch",
            "selected_symptom_code": "NSP_DEFECT_BASIC_INFO_MISMATCH",
            "supplied_facts": {
                "application_type": "FRESH",
                "active_applications_count": "ONE",
            },
        },
    )
    assert res_fresh.status_code == 200
    data_fresh = res_fresh.json()
    assert data_fresh["verdict"] == TriageVerdictType.PROCEDURAL_TRAP_WARNING.value
    assert "DO NOT WITHDRAW THIS APPLICATION" in data_fresh["critical_trap_warning"]
    assert data_fresh["draft_grievance_text"] is not None

    # Step 3: With application_type = RENEWAL, must return CORRECTABLE_DEFECT
    res_renewal = client.post(
        "/api/v1/rescue/diagnose",
        json={
            "raw_status_text": "Application marked Defective by INO: Father name mismatch",
            "selected_symptom_code": "NSP_DEFECT_BASIC_INFO_MISMATCH",
            "supplied_facts": {
                "application_type": "RENEWAL",
                "active_applications_count": "ONE",
            },
        },
    )
    assert res_renewal.status_code == 200
    assert res_renewal.json()["verdict"] == TriageVerdictType.CORRECTABLE_DEFECT.value


def test_substantive_exclusion_triggers_no_dead_end_alternatives():
    res = client.post(
        "/api/v1/rescue/diagnose",
        json={
            "raw_status_text": "PM-KISAN Rejected: Applicant does not own cultivable land",
            "selected_symptom_code": "PMKISAN_SUBSTANTIVE_LAND_EXCLUSION",
            "profile": {
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
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["verdict"] == TriageVerdictType.SUBSTANTIVE_EXCLUSION.value
    alt_slugs = [alt["scheme_slug"] for alt in body["alternative_schemes"]]
    assert "pmay-g" in alt_slugs
    assert "pm-jay" in alt_slugs
    for alt in body["alternative_schemes"]:
        assert alt["overall_status"] in (
            EligibilityStatus.ELIGIBLE.value,
            EligibilityStatus.PARTIALLY_ELIGIBLE.value,
        )
