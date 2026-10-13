import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_list_schemes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/schemes")
        assert resp.status_code == 200
        schemes = resp.json()
        assert len(schemes) >= 5
        slugs = [s["slug"] for s in schemes]
        assert "pm-kisan" in slugs
        assert "pm-jay" in slugs


@pytest.mark.asyncio
async def test_get_scheme_detail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/schemes/pm-kisan")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "pm-kisan"
        assert len(data["criteria"]) == 10
        assert len(data["documents"]) == 3
        assert len(data["evidence_chunks"]) >= 2
        assert data["source"]["verification_status"] == "VERIFIED"


@pytest.mark.asyncio
async def test_discover_schemes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/schemes/discover",
            json={
                "profile": {
                    "occupation": "farmer",
                    "state": "TS",
                    "landholding_acres": 3.0,
                },
                "goal": "farming input assistance",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        top_scheme = data[0]
        assert "farm" in top_scheme["name"].lower() or "kisan" in top_scheme["name"].lower() or "rythu" in top_scheme["name"].lower()
        assert top_scheme["retrieval_mode"] == "lexical_category_match"


@pytest.mark.asyncio
async def test_profile_validate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/profile/validate",
            json={
                "profile": {
                    "state": "ts",
                    "age": "35",
                    "annual_income_inr": "₹ 1,80,000",
                    "occupation": " Farmer ",
                    "category": "obc",
                    "landholding_acres": "2.5",
                }
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        norm = data["normalized_profile"]
        assert norm["state"] == "TS"
        assert norm["age"] == 35
        assert norm["annual_income_inr"] == 180000.0
        assert norm["occupation"] == "farmer"
        assert norm["category"] == "OBC"
        assert norm["landholding_acres"] == 2.5


@pytest.mark.asyncio
async def test_evaluate_eligibility_eligible():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/eligibility/evaluate",
            json={
                "scheme_id": "pm-kisan",
                "profile": {
                    "occupation": "farmer",
                    "landholding_acres": 2.0,
                    "is_institutional_landholder": False,
                    "is_government_employee": False,
                    "is_income_tax_payee": False,
                    "has_constitutional_post_holder": False,
                    "has_specified_elected_representative": False,
                    "has_pensioner_above_10k_non_mts": False,
                    "has_practicing_professional": False,
                    "is_nri_or_foreign_resident": False,
                },
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ELIGIBLE"
        assert data["completeness"] == "COMPLETE"
        assert len(data["criteria"]) == 10
        for crit in data["criteria"]:
            assert crit["status"] == "met"


@pytest.mark.asyncio
async def test_evaluate_eligibility_missing_info():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/eligibility/evaluate",
            json={
                "scheme_id": "pm-kisan",
                "profile": {
                    "occupation": "farmer",
                    # landholding_acres missing
                },
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "PARTIALLY_ELIGIBLE"
        assert data["completeness"] == "INCOMPLETE"
        assert "landholding_acres" in data["missing_information"]


@pytest.mark.asyncio
async def test_sources_and_evidence():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test sources listing
        resp = await client.get("/api/v1/sources")
        assert resp.status_code == 200
        sources = resp.json()
        assert len(sources) >= 5

        # Test sources status summary
        resp_status = await client.get("/api/v1/sources/status")
        assert resp_status.status_code == 200
        status_data = resp_status.json()
        assert status_data["demo_mode"] is True
        assert status_data["verified_sources"] >= 5

        # Test evidence search
        resp_ev = await client.get("/api/v1/sources/evidence?q=landholding")
        assert resp_ev.status_code == 200
        evidence = resp_ev.json()
        assert len(evidence) >= 1
        assert "land" in evidence[0]["quote"].lower()


@pytest.mark.asyncio
async def test_action_plan_generation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/action-plans/generate",
            json={
                "scheme_id": "pm-kisan",
                "profile": {
                    "occupation": "farmer",
                    "landholding_acres": 2.5,
                    "is_institutional_landholder": False,
                    "is_government_employee": False,
                    "is_income_tax_payee": False,
                    "has_constitutional_post_holder": False,
                    "has_specified_elected_representative": False,
                    "has_pensioner_above_10k_non_mts": False,
                    "has_practicing_professional": False,
                    "is_nri_or_foreign_resident": False,
                },
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["overall_status"] == "ELIGIBLE"
        assert len(data["roadmap"]) >= 2
        assert len(data["required_documents"]) == 3
        assert "explanation" in data
        assert data["explanation"]["is_fallback"] is True  # Deterministic fallback when no key


@pytest.mark.asyncio
async def test_langgraph_workflow_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/workflow/run",
            json={
                "profile": {
                    "state": "TS",
                    "occupation": "farmer",
                    "landholding_acres": 3.0,
                    "annual_income_inr": 150000,
                },
                "goal": "farming grant",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert len(data["steps_log"]) == 6
        step_names = [s["step_name"] for s in data["steps_log"]]
        assert "NORMALIZING PROFILE" in step_names
        assert "DISCOVERING SCHEMES" in step_names
        assert "EVALUATING RULES" in step_names
        assert "CHECKING DOCUMENTS & DEADLINES" in step_names
        assert "VERIFYING SOURCES" in step_names
        assert "PREPARING ACTION PLAN" in step_names


@pytest.mark.asyncio
async def test_pmjay_cashless_action_plan_no_bank_dbt():
    """Verify that PM-JAY action plan specifically mentions cashless hospitalization
    and does NOT enforce a bank account or direct benefit cash transfer.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/action-plans/generate",
            json={
                "scheme_id": "pm-jay",
                "profile": {
                    "annual_income_inr": 180000,
                    "category": "OBC",
                },
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["overall_status"] == "ELIGIBLE"
        roadmap_titles = [s["title"] for s in data["roadmap"]]
        assert any("Ayushman" in t for t in roadmap_titles)
        assert any("Cashless" in t for t in roadmap_titles)
        # Verify portal URL points to official NHA
        assert "nha.gov.in" in data["official_portal_url"]
        # Verify document requirement types are classified
        req_types = [d.get("requirement_type") for d in data["required_documents"]]
        assert "MANDATORY" in req_types
        assert "NOT_APPLICABLE" in req_types


@pytest.mark.asyncio
async def test_health_endpoint_honest_fallback_status():
    """Verify health endpoint honestly reports deterministic_fallback and lexical retrieval."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["llm_status"] == "deterministic_fallback"
        assert data["retrieval_mode"] == "lexical"
        assert data["demo_mode"] is True


@pytest.mark.asyncio
async def test_pmayg_multi_criteria_incomplete_and_exclusions():
    """Verify PMAY-G evaluates to PARTIALLY_ELIGIBLE when asset questionnaire fields are missing,
    and NOT_ELIGIBLE when owning pucca house or motorized vehicle.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Incomplete profile (missing pucca house, motorized vehicle etc.)
        resp_inc = await client.post(
            "/api/v1/eligibility/evaluate",
            json={
                "scheme_id": "pmay-g",
                "profile": {
                    "annual_income_inr": 120000,
                    "residence_area": "rural",
                },
            },
        )
        assert resp_inc.status_code == 200
        data_inc = resp_inc.json()
        assert data_inc["status"] == "PARTIALLY_ELIGIBLE"
        assert data_inc["completeness"] == "INCOMPLETE"
        assert "owns_pucca_house" in data_inc["missing_information"]
        assert "has_motorized_vehicle" in data_inc["missing_information"]

        # Disqualified by owning a pucca house
        resp_disq = await client.post(
            "/api/v1/eligibility/evaluate",
            json={
                "scheme_id": "pmay-g",
                "profile": {
                    "annual_income_inr": 120000,
                    "residence_area": "rural",
                    "owns_pucca_house": True,
                    "lives_in_kutcha_house": False,
                    "has_more_than_two_pucca_rooms": False,
                    "has_motorized_vehicle": False,
                    "is_government_employee": False,
                    "has_kcc_above_50k": False,
                    "has_mechanized_agri_equipment": False,
                    "has_registered_non_agri_enterprise": False,
                    "earns_above_15k_monthly": False,
                    "is_income_tax_payee": False,
                    "pays_professional_tax": False,
                    "irrigated_land_acres": 0.0,
                    "unirrigated_land_acres": 1.0,
                },
            },
        )
        assert resp_disq.status_code == 200
        data_disq = resp_disq.json()
        assert data_disq["status"] == "NOT_ELIGIBLE"
        assert data_disq["completeness"] == "COMPLETE"


@pytest.mark.asyncio
async def test_rythu_bharosa_telangana_benefit():
    """Verify Rythu Bharosa criteria and action plan reflect the current Telangana ₹12,000/acre input assistance."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/schemes/rythu-bharosa")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "rythu-bharosa"
        assert "12,000" in data["description"]
        assert data["level"] == "STATE"
        assert data["state"] == "TS"

        # Action plan generation
        resp_plan = await client.post(
            "/api/v1/action-plans/generate",
            json={
                "scheme_id": "rythu-bharosa",
                "profile": {
                    "state": "TS",
                    "occupation": "farmer",
                    "landholding_acres": 2.5,
                },
            },
        )
        assert resp_plan.status_code == 200
        plan_data = resp_plan.json()
        assert plan_data["overall_status"] == "ELIGIBLE"
        actions_str = " ".join([s["action"] for s in plan_data["roadmap"]])
        assert "12,000" in actions_str


@pytest.mark.asyncio
async def test_langgraph_workflow_no_schemes_fallback():
    """Verify LangGraph workflow branches to no_schemes_fallback when no schemes match."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/workflow/run",
            json={
                "profile": {
                    "state": "ZZ",  # Non-existent state
                    "occupation": "astronaut",
                    "annual_income_inr": 99999999,
                },
                "goal": "space grant",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        step_names = [s["step_name"] for s in data["steps_log"]]
        assert "DISCOVERY FALLBACK" in step_names
        assert data["action_plan"]["overall_status"] == "NOT_ELIGIBLE"

