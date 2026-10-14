from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_assistant_answers_scheme_updates_question_without_blind_schemes_redirect():
    res = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "Show me recently verified scheme updates",
            "lang": "en",
            "current_path": "/",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["intent_classified"] == "SCHEME_UPDATES_SUMMARY"
    assert "Post-Matric Scholarship for SC Students" in body["reply_text"]
    assert body["action"]["target_path"] == "/announcements"


def test_assistant_explains_pm_kisan_in_telugu_on_request():
    res = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "Explain PM-KISAN in Telugu",
            "lang": "en",
            "profile": {"state": "TS", "occupation": "farmer", "landholding_acres": 2.0},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["lang"] == "te"
    assert "₹6,000" in body["reply_text"]
    assert body["action"]["action_type"] == "NONE"


def test_assistant_multi_turn_follow_up_for_documents():
    # Turn 1 discussed nsp-post-matric; Turn 2 asks "What documents do I need?"
    res = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "What documents do I need?",
            "lang": "hi",
            "history": [
                {"role": "user", "content": "Tell me about NSP Post-Matric Scholarship"},
                {"role": "assistant", "content": "Post-Matric Scholarship for SC Students details..."},
            ],
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["intent_classified"] == "SCHEME_DOCUMENTS_CHECKLIST"
    assert "Caste Certificate (SC)" in body["reply_text"]
    assert "Income Certificate" in body["reply_text"]


def test_tts_capabilities_and_chunked_fallback_for_telugu_and_urdu():
    cap_res = client.get("/api/v1/tts/capabilities")
    assert cap_res.status_code == 200
    cap = cap_res.json()
    assert cap["model_id"] == "eleven_v3"
    assert "te" in cap["supported_languages"]
    assert "ur" in cap["supported_languages"]

    synth_res = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "ఈ సమాచారం అధికారిక పోర్టల్ నిబంధనల ఆధారంగా అందించబడింది. ఇది ప్రభుత్వ ఆమోదానికి హామీ ఇవ్వదు.",
            "lang": "te",
        },
    )
    assert synth_res.status_code == 200
    synth = synth_res.json()
    assert len(synth["text_chunks"]) >= 1
    assert synth["lang"] == "te"
