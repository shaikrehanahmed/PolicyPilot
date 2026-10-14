from fastapi.testclient import TestClient

from app.main import app
from app.schemas.common import VerificationStatus

client = TestClient(app)


def test_list_announcements_returns_verified_government_records():
    res = client.get("/api/v1/announcements")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5

    # Check first item has official source, hash, and verification status
    item = data[0]
    assert "source_url" in item and item["source_url"].startswith("http")
    assert "content_hash" in item and len(item["content_hash"]) > 0
    assert "last_verified_at" in item
    assert "verification_status" in item


def test_announcements_verification_gating():
    # Unfiltered includes REQUIRES_REVIEW items
    res_all = client.get("/api/v1/announcements")
    assert res_all.status_code == 200
    all_items = res_all.json()

    review_items = [i for i in all_items if i["verification_status"] == VerificationStatus.REQUIRES_REVIEW.value]
    assert len(review_items) >= 1

    # In unverified/requires_review items, benefits, eligibility and apply URLs are withheld per guardrails
    for r in review_items:
        assert r["benefits_summary"] is None
        assert r["eligibility_summary"] is None
        assert r["application_url"] is None
        assert r["review_note"] is not None

    # Filtered by verified_only
    res_verified = client.get("/api/v1/announcements?verified_only=true")
    assert res_verified.status_code == 200
    verified_items = res_verified.json()
    for v in verified_items:
        assert v["verification_status"] == VerificationStatus.VERIFIED.value
        assert v["benefits_summary"] is not None
        assert v["application_url"] is not None


def test_announcements_check_updates_audit_and_truthful_disclosure():
    res = client.post("/api/v1/announcements/check-updates")
    assert res.status_code == 200
    body = res.json()

    assert "checked_at" in body
    assert body["monitoring_mode"] == "on_demand_hash_audit"
    assert body["scheduler_active"] is False
    assert "cron worker" in body["external_requirements_note"].lower()
    assert body["total_sources_checked"] >= 5
    assert body["verified_announcements_count"] >= 4
    assert len(body["detected_changes"]) >= 4


def test_announcements_multilingual_localization():
    res_en = client.get("/api/v1/announcements?lang=en")
    res_te = client.get("/api/v1/announcements?lang=te")
    res_hi = client.get("/api/v1/announcements?lang=hi")

    assert res_en.status_code == 200
    assert res_te.status_code == 200
    assert res_hi.status_code == 200

    en_title = res_en.json()[0]["title"]
    te_title = res_te.json()[0]["title"]
    hi_title = res_hi.json()[0]["title"]

    assert en_title != te_title
    assert en_title != hi_title
    # Official scheme name must remain canonical in all languages
    assert res_en.json()[0]["official_scheme_name"] == res_te.json()[0]["official_scheme_name"]
