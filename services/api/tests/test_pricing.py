from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_pricing_catalog_returns_plans_and_honesty_disclosure():
    res = client.get("/api/v1/pricing/catalog")
    assert res.status_code == 200
    data = res.json()
    assert data["individual_intro_price_inr"] == 19.0
    assert data["free_analyses_new_user"] == 2
    assert data["org_bulk_discount_percentage"] == 25.0
    assert data["payment_gateway_status"] == "sandbox_demonstration"
    assert "sandbox" in data["honesty_note"].lower()

    plans = {p["id"]: p for p in data["plans"]}
    assert "free" in plans
    assert "individual" in plans
    assert "organization" in plans

    assert plans["individual"]["introductory_price_inr"] == 19.0
    assert plans["organization"]["monthly_price_inr"] == 99.0


def test_organization_seat_calculator_applies_exact_25_percent_discount():
    # Test 10 seats @ 99.0 gross = 990.0, 25% discount = 247.5, net = 742.5, per seat = 74.25
    res = client.post(
        "/api/v1/pricing/calculate-organization",
        json={"seats": 10, "billing_cycle": "monthly"},
    )
    assert res.status_code == 200
    calc = res.json()
    assert calc["seats"] == 10
    assert calc["base_price_per_seat_inr"] == 99.0
    assert calc["gross_total_inr"] == 990.0
    assert calc["discount_percentage"] == 25.0
    assert calc["discount_amount_inr"] == 247.5
    assert calc["net_total_inr"] == 742.5
    assert calc["effective_per_seat_price_inr"] == 74.25
    assert calc["payment_gateway_status"] == "sandbox_demonstration"


def test_organization_seat_calculator_bounds():
    # Min bounds test
    res = client.post(
        "/api/v1/pricing/calculate-organization",
        json={"seats": 1, "billing_cycle": "monthly"},
    )
    assert res.status_code == 200
    calc = res.json()
    assert calc["seats"] == 1
    assert calc["gross_total_inr"] == 99.0
    assert calc["discount_amount_inr"] == 24.75
    assert calc["net_total_inr"] == 74.25
