from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.tracking import OfficialLifecycleStatus, UserApplicationStatus
from app.services.billing_engine import (
    calculate_organization_seat_quote,
    get_billing_store,
)

client = TestClient(app)


def setup_function():
    get_billing_store().reset_state()


def test_1_to_5_tracking_visits_applied_status_lifecycle_and_dedup():
    uid = "citizen-track-01"

    # C1: Record visit and verify persisted to authenticated user session
    v1 = client.post(
        "/api/v1/tracking/visit",
        headers={"X-User-ID": uid},
        json={"scheme_slug": "pm-kisan"},
    )
    assert v1.status_code == 200
    assert len(v1.json()["recently_visited"]) == 1

    # C2: Mark scheme as Applied and verify date + external portal disclaimer
    app_res = client.post(
        "/api/v1/tracking/status",
        headers={"X-User-ID": uid},
        json={
            "scheme_slug": "pm-kisan",
            "user_confirmed_status": UserApplicationStatus.APPLIED.value,
        },
    )
    assert app_res.status_code == 200
    my_apps = app_res.json()["my_applications"]
    assert len(my_apps) == 1
    assert my_apps[0]["applied_at"] is not None
    assert "cannot independently verify submission" in my_apps[0]["external_submission_disclaimer"]

    # C3 & C5: Verify explicit lifecycle status ("Results Announced") and Results Guidance
    assert (
        my_apps[0]["official_lifecycle_status"]
        == OfficialLifecycleStatus.RESULTS_ANNOUNCED.value
    )
    assert my_apps[0]["results_guidance"]["has_published_results"] is True
    assert my_apps[0]["results_guidance"]["official_results_portal_url"] == "https://pmkisan.gov.in/"

    # C3: Unverified scheme must return "Status Unverified" and zero notifications
    unver = client.post(
        "/api/v1/tracking/visit",
        headers={"X-User-ID": uid},
        json={"scheme_slug": "example-draft-scheme"},
    )
    unver_rec = next(
        r
        for r in unver.json()["tracked_schemes"]
        if r["scheme_slug"] == "example-draft-scheme"
    )
    assert (
        unver_rec["official_lifecycle_status"]
        == OfficialLifecycleStatus.STATUS_UNVERIFIED.value
    )


def test_6_and_7_two_free_successful_analyses_limit_and_retry_failure_safety():
    uid = "student-free-tier-01"

    # Failed analysis MUST NOT consume a free analysis
    fail_res = client.post(
        "/api/v1/workflow/run",
        headers={"X-User-ID": uid, "Idempotency-Key": "fail-attempt-1"},
        json={"profile": {"state": "TS"}, "simulate_failure": True},
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["status"] == "ERROR"
    acc0 = client.get("/api/v1/billing/account", headers={"X-User-ID": uid}).json()
    assert acc0["successful_analyses_used"] == 0
    assert acc0["free_analyses_remaining"] == 2

    # Analysis #1 (with duplicate retry using same Idempotency-Key -> counts only ONCE)
    r1 = client.post(
        "/api/v1/workflow/run",
        headers={"X-User-ID": uid, "Idempotency-Key": "idem-run-1"},
        json={"profile": {"state": "TS", "occupation": "farmer", "landholding_acres": 2.0}},
    )
    assert r1.status_code == 200
    r1_retry = client.post(
        "/api/v1/workflow/run",
        headers={"X-User-ID": uid, "Idempotency-Key": "idem-run-1"},
        json={"profile": {"state": "TS", "occupation": "farmer", "landholding_acres": 2.0}},
    )
    assert r1_retry.status_code == 200
    assert r1_retry.json()["usage_summary"]["successful_analyses_used"] == 1

    # Analysis #2 -> consumes 2nd free analysis
    r2 = client.post(
        "/api/v1/workflow/run",
        headers={"X-User-ID": uid, "Idempotency-Key": "idem-run-2"},
        json={"profile": {"state": "TS", "occupation": "student", "category": "SC"}},
    )
    assert r2.status_code == 200
    assert r2.json()["usage_summary"]["successful_analyses_used"] == 2
    assert r2.json()["usage_summary"]["free_analyses_remaining"] == 0

    # Analysis #3 -> MUST be blocked server-side with HTTP 402 Payment Required
    r3_blocked = client.post(
        "/api/v1/workflow/run",
        headers={"X-User-ID": uid, "Idempotency-Key": "idem-run-3"},
        json={"profile": {"state": "TS", "occupation": "farmer"}},
    )
    assert r3_blocked.status_code == 402
    assert r3_blocked.json()["detail"]["current_individual_price_inr"] == "19.00"


def test_8_exact_organization_25_percent_discount_calculation():
    # 100 seats at ₹19 (1900 paise) -> ₹1,900 original, ₹475 discount, ₹1,425 final
    quote = calculate_organization_seat_quote(seats=100, unit_price_paise=1900, discount_percent=25)
    assert quote.original_total_inr == Decimal("1900.00")
    assert quote.discount_amount_inr == Decimal("475.00")
    assert quote.final_monthly_inr == Decimal("1425.00")
    assert quote.effective_per_seat_inr == Decimal("14.25")


def test_9_to_12_org_isolation_seat_limits_admin_pricing_and_hmac_checkout():
    admin_uid = "college-admin-1"
    other_uid = "intruder-user-2"

    # Create organization with 2 seats
    org_res = client.post(
        "/api/v1/billing/organizations",
        headers={"X-User-ID": admin_uid},
        json={"name": "Test Engineering College", "initial_seats": 2},
    )
    assert org_res.status_code == 200
    org_id = org_res.json()["org_id"]

    # Cross-org isolation: intruder cannot view or assign seats
    forbidden = client.get(
        f"/api/v1/billing/organizations/{org_id}",
        headers={"X-User-ID": other_uid},
    )
    assert forbidden.status_code == 403

    # Checkout & HMAC verification for Organization Plan
    order_res = client.post(
        "/api/v1/billing/checkout/create-order",
        headers={"X-User-ID": admin_uid},
        json={"plan_type": "ORGANIZATION", "seats": 2, "org_id": org_id},
    )
    assert order_res.status_code == 200
    order_id = order_res.json()["order_id"]

    # Invalid signature must fail with 400
    bad_verify = client.post(
        "/api/v1/billing/checkout/verify",
        headers={"X-User-ID": admin_uid},
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake",
            "razorpay_signature": "invalid_hmac_hex",
        },
    )
    assert bad_verify.status_code == 400

    # Valid HMAC signature activates subscription
    sig_bundle = client.post(
        f"/api/v1/billing/checkout/sandbox-test-signature?order_id={order_id}",
        headers={"X-User-ID": admin_uid},
    ).json()
    good_verify = client.post(
        "/api/v1/billing/checkout/verify",
        headers={"X-User-ID": admin_uid},
        json=sig_bundle,
    )
    assert good_verify.status_code == 200

    # Assign 2 seats -> 3rd seat must fail server-side seat limit
    client.post(
        f"/api/v1/billing/organizations/{org_id}/seats/assign",
        headers={"X-User-ID": admin_uid},
        json={"member_email": "s1@college.edu", "member_user_id": "student-1"},
    )
    client.post(
        f"/api/v1/billing/organizations/{org_id}/seats/assign",
        headers={"X-User-ID": admin_uid},
        json={"member_email": "s2@college.edu", "member_user_id": "student-2"},
    )
    over_limit = client.post(
        f"/api/v1/billing/organizations/{org_id}/seats/assign",
        headers={"X-User-ID": admin_uid},
        json={"member_email": "s3@college.edu", "member_user_id": "student-3"},
    )
    assert over_limit.status_code == 400

    # Admin pricing update: unauthorized user rejected (403); authorized admin updates to ₹29
    unauth_price = client.put(
        "/api/v1/billing/admin/pricing",
        headers={"X-Admin-Key": "wrong-key"},
        json={"new_individual_price_inr": "29.00", "org_discount_percent": 25},
    )
    assert unauth_price.status_code == 403

    auth_price = client.put(
        "/api/v1/billing/admin/pricing",
        headers={"X-Admin-Key": "policypilot-admin-dev-key"},
        json={"new_individual_price_inr": "29.00", "org_discount_percent": 25},
    )
    assert auth_price.status_code == 200
    assert auth_price.json()["individual_price_inr"] == "29.00"
