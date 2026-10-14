"""Context-Aware Multilingual Conversational Assistant for PolicyPilot.

Solves Problems #2, #3, and #5:
1. Distinguishes explicit navigation commands ("Open Rescue Mode", "Show all schemes", "Go back")
   from genuine policy questions ("What scholarships can I apply for?", "Explain PM-KISAN in Telugu",
   "What documents do I need?", "Why was my application marked defective?").
2. Uses the real DemoRepository, evaluate_scheme_eligibility(), Rescue Evaluator, and Announcements
   engine to answer questions with official evidence.
3. Detects explicit language override inside the query (e.g., "...in Telugu", "...in Hindi", "...in Urdu").
4. Supports multi-turn session history so follow-up questions ("What documents do I need for it?")
   resolve the scheme discussed in the previous turn.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter

from ..ai.i18n import get_localized_text, localize_scheme_dict
from ..ai.workflow import _normalize_profile_data
from ..demo.repository import get_demo_repo
from ..rules.evaluator import evaluate_scheme_eligibility
from ..rules.rescue_evaluator import (
    match_symptom_code_lexically,
    scrub_sensitive_input,
)
from ..schemas.assistant import (
    AssistantActionDirective,
    AssistantChatRequest,
    AssistantChatResponse,
)
from ..schemas.rescue import SupportedLanguage
from .announcements import build_deduplicated_announcements

logger = logging.getLogger("policypilot.api.assistant")
router = APIRouter(prefix="/assistant", tags=["Conversational Assistant"])

_SCHEME_ALIASES: Dict[str, List[str]] = {
    "pm-kisan": ["pm-kisan", "pm kisan", "kisan samman", "కిసాన్", "पीएम किसान", "کسان سمان"],
    "pm-jay": ["pm-jay", "pmjay", "ayushman", "ఆయుష్మాన్", "आयुष्मान", "آیوشمان", "health cover"],
    "pmay-g": ["pmay-g", "pmayg", "awaas", "housing", "ఆవాస్", "आवास", "آواس", "pucca house"],
    "nsp-post-matric": [
        "nsp",
        "post-matric",
        "post matric",
        "scholarship",
        "స్కాలర్షిప్",
        "छात्रवृत्ति",
        "اسکالرشپ",
    ],
    "rythu-bharosa": ["rythu", "bharosa", "bandhu", "రైతు భరోసా", "रायथू भरोसा", "رعیتو بھروسہ"],
}


def _detect_language_override(text_lower: str, default_lang: SupportedLanguage) -> SupportedLanguage:
    if any(k in text_lower for k in ["in telugu", "తెలుగులో", "telugu lo"]):
        return SupportedLanguage.TE
    if any(k in text_lower for k in ["in hindi", "हिंदी में", "हिन्दी में"]):
        return SupportedLanguage.HI
    if any(k in text_lower for k in ["in urdu", "اردو میں"]):
        return SupportedLanguage.UR
    if any(k in text_lower for k in ["in english"]):
        return SupportedLanguage.EN
    return default_lang


def _resolve_target_scheme_slug(
    message_lower: str,
    current_scheme_slug: Optional[str],
    history: List[Any],
) -> Optional[str]:
    # 1. Explicit mention in current message
    for slug, aliases in _SCHEME_ALIASES.items():
        if any(a in message_lower for a in aliases):
            return slug

    # 2. If user says "this scheme" or "it" and is on a scheme detail page
    if current_scheme_slug:
        return current_scheme_slug

    # 3. Inspect conversation history from most recent to oldest
    for item in reversed(history):
        content_lower = (item.content or "").lower()
        for slug, aliases in _SCHEME_ALIASES.items():
            if any(a in content_lower for a in aliases):
                return slug

    return None


@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(payload: AssistantChatRequest) -> AssistantChatResponse:
    scrubbed_msg = scrub_sensitive_input(payload.message)
    msg_lower = scrubbed_msg.lower().strip()
    active_lang = _detect_language_override(msg_lower, payload.lang)
    lang_code = active_lang.value

    repo = get_demo_repo()
    norm_profile = _normalize_profile_data(payload.profile or {})

    # ------------------------------------------------------------------
    # 1. Audio Stop / Go Back / Explicit Page Navigation Commands
    # ------------------------------------------------------------------
    if any(
        cmd in msg_lower
        for cmd in ["stop speaking", "stop audio", "quiet", "ఆపు", "बंद करो", "آواز بند"]
    ):
        return AssistantChatResponse(
            reply_text=get_localized_text(
                {
                    "en": "Stopped audio playback. Ask your next question whenever you are ready.",
                    "te": "ఆడియో నిలిపివేయబడింది. మీ తదుపరి ప్రశ్నను అడగండి.",
                    "hi": "ऑडियो रोक दिया गया है। जब आप तैयार हों तो अगला प्रश्न पूछें।",
                    "ur": "آڈیو روک دی گئی ہے۔ اپنا اگلا سوال پوچھیں۔",
                },
                lang_code,
            ),
            lang=active_lang,
            intent_classified="STOP_AUDIO",
            action=AssistantActionDirective(action_type="STOP_AUDIO"),
            provider_used="deterministic_policy_engine",
        )

    if any(
        cmd in msg_lower
        for cmd in ["go back", "previous page", "వెనుకకు వెళ్ళు", "पीछे जाएं", "واپس جائیں"]
    ):
        return AssistantChatResponse(
            reply_text=get_localized_text(
                {
                    "en": "Going back to the previous page.",
                    "te": "మునుపటి పేజీకి వెళ్తున్నాము.",
                    "hi": "पिछले पृष्ठ पर वापस जा रहे हैं।",
                    "ur": "پچھلے صفحے پر واپس جا رہے ہیں۔",
                },
                lang_code,
            ),
            lang=active_lang,
            intent_classified="GO_BACK",
            action=AssistantActionDirective(action_type="GO_BACK"),
            provider_used="deterministic_policy_engine",
        )

    # Check if user is asking about Scheme Updates / Announcements
    is_update_query = any(
        kw in msg_lower
        for kw in [
            "scheme update",
            "updates",
            "new announcement",
            "newly announced",
            "recent scheme",
            "కొత్త ప్రకటనలు",
            "అప్డేట్",
            "नई घोषणा",
            "अपडेट",
            "نئے اعلانات",
            "اپ ڈیٹ",
        ]
    )
    if is_update_query:
        anns, _ = build_deduplicated_announcements(lang=lang_code)
        verified_anns = [a for a in anns if a.verification_status.value == "VERIFIED"]
        bullet_lines = "\n".join(
            [f"• {a.official_scheme_name}: {a.title}" for a in verified_anns[:3]]
        )
        explicit_open = any(
            v in msg_lower for v in ["open", "go to", "check scheme updates", "show me"]
        )
        reply = get_localized_text(
            {
                "en": f"Here are the {len(verified_anns)} verified official scheme updates in our registry:\n{bullet_lines}\n(1 draft notice is withheld awaiting gazette verification.)",
                "te": f"మా రిజిస్ట్రీలో ధృవీకరించబడిన {len(verified_anns)} అధికారిక పథకాల అప్డేట్లు ఇక్కడ ఉన్నాయి:\n{bullet_lines}",
                "hi": f"हमारी रजिस्ट्री में {len(verified_anns)} सत्यापित आधिकारिक योजना अपडेट यहां दिए गए हैं:\n{bullet_lines}",
                "ur": f"ہماری رجسٹری میں تصدیق شدہ {len(verified_anns)} سرکاری اسکیم اپ ڈیٹس درج ذیل ہیں:\n{bullet_lines}",
            },
            lang_code,
        )
        return AssistantChatResponse(
            reply_text=reply,
            lang=active_lang,
            intent_classified="SCHEME_UPDATES_SUMMARY",
            action=AssistantActionDirective(
                action_type="NAVIGATE" if explicit_open else "NONE",
                target_path="/announcements" if explicit_open else None,
            ),
            provider_used="deterministic_policy_engine",
        )

    # ------------------------------------------------------------------
    # 2. Application Defect / Rejection Diagnosis Questions
    # ------------------------------------------------------------------
    matched_defect_code = match_symptom_code_lexically(scrubbed_msg)
    is_defect_question = matched_defect_code is not None or any(
        kw in msg_lower
        for kw in [
            "defective",
            "marked defective",
            "open rescue",
            "rescue mode",
            "pfms rejected",
            "npci",
            "otr mismatch",
            "లోపం",
            "డిఫెక్టివ్",
            "दोषपूर्ण",
            "डिफेक्टिव",
            "خرابی",
        ]
    )
    if is_defect_question:
        if any(v in msg_lower for v in ["open rescue", "go to rescue"]):
            return AssistantChatResponse(
                reply_text=get_localized_text(
                    {
                        "en": "Opening Scholarship & Benefit Defect Rescue Mode. Paste or speak your portal status message to get a step-by-step fix.",
                        "te": "స్కాలర్షిప్ రెస్క్యూ మోడ్ను తెరుస్తున్నాము. మీ పోర్టల్ స్టేటస్ మెసేజ్ను చెప్పండి.",
                        "hi": "स्कॉलरशिप रेस्क्यू मोड खोल रहे हैं। अपना पोर्टल स्टेटस संदेश बताएं।",
                        "ur": "اسکالرشپ ریسکیو موڈ کھول رہے ہیں۔ اپنا پورٹل اسٹیٹس پیغام بتائیں۔",
                    },
                    lang_code,
                ),
                lang=active_lang,
                intent_classified="OPEN_RESCUE_MODE",
                action=AssistantActionDirective(action_type="NAVIGATE", target_path="/rescue"),
                provider_used="deterministic_policy_engine",
            )

        reply = get_localized_text(
            {
                "en": (
                    "If your National Scholarship Portal (NSP) application was marked 'Defective by INO', "
                    "DO NOT withdraw a Fresh application (NSP Manual v2.2 Page 4 prohibits revoking a withdrawn "
                    "Fresh form). Instead: (1) Update the mismatched detail in the NSP OTR module, (2) Click "
                    "'Refresh Applicant Details from OTR' in My Profile, and (3) Re-submit to your college INO "
                    "with your original certificates. Would you like me to open Rescue Mode to generate a printable office letter?"
                ),
                "te": (
                    "మీ NSP స్కాలర్షిప్ దరఖాస్తు 'Defective by INO' అని చూపిస్తే, మీ కొత్త (Fresh) దరఖాస్తును "
                    "Withdraw చేయవద్దు (NSP v2.2 ప్రకారం మళ్లీ పునరుద్ధరించలేరు). దానికి బదులుగా: (1) NSP OTR మాడ్యూల్లో "
                    "వివరాలు అప్డేట్ చేయండి, (2) ప్రొఫైల్లో 'Refresh Applicant Details from OTR' నొక్కండి, (3) కళాశాల "
                    "INO వద్ద ఒరిజినల్ సర్టిఫికెట్లతో రీ-వెరిఫికేషన్ చేయించుకోండి."
                ),
                "hi": (
                    "यदि आपका NSP छात्रवृत्ति आवेदन 'Defective by INO' चिह्नित है, तो फ्रेश (Fresh) आवेदन को वापस "
                    "(Withdraw) न लें (NSP नियमावली v2.2 पृष्ठ 4 के अनुसार इसे दोबारा बहाल नहीं किया जा सकता)। इसके "
                    "बजाय: (1) NSP OTR मॉड्यूल में विवरण अपडेट करें, (2) प्रोफाइल में 'Refresh Applicant Details from OTR' "
                    "पर क्लिक करें, और (3) मूल प्रमाण-पत्रों के साथ कॉलेज INO से पुनः सत्यापन कराएं।"
                ),
                "ur": (
                    "اگر آپ کی NSP اسکالرشپ درخواست 'Defective by INO' ہے تو نئی (Fresh) درخواست کو ہرگز Withdraw نہ کریں۔ "
                    "پہلے NSP OTR ماڈیول میں تفصیلات اپ ڈیٹ کریں، پھر 'Refresh Applicant Details from OTR' پر کلک کریں اور اپنے کالج کے INO سے تصدیق کرائیں۔"
                ),
            },
            lang_code,
        )
        return AssistantChatResponse(
            reply_text=reply,
            lang=active_lang,
            intent_classified="DEFECT_DIAGNOSIS_HELP",
            action=AssistantActionDirective(action_type="NONE"),
            follow_up_question=get_localized_text(
                {
                    "en": "Is your scholarship application a Fresh application or a Renewal?",
                    "te": "మీ స్కాలర్షిప్ దరఖాస్తు కొత్తదా (Fresh) లేక రెన్యువలా (Renewal)?",
                    "hi": "क्या आपका छात्रवृत्ति आवेदन फ्रेश (Fresh) है या रिन्यूअल (Renewal)?",
                    "ur": "کیا آپ کی اسکالرشپ درخواست نئی (Fresh) ہے یا تجدید (Renewal)؟",
                },
                lang_code,
            ),
            provider_used="deterministic_policy_engine",
        )

    # ------------------------------------------------------------------
    # 3. Document Checklist / Scheme Explanation / Eligibility Questions
    # ------------------------------------------------------------------
    target_slug = _resolve_target_scheme_slug(
        msg_lower, payload.current_scheme_slug, payload.history
    )

    # Check if user explicitly said "Show all schemes"
    if any(
        cmd in msg_lower
        for cmd in ["show all schemes", "open schemes", "list all schemes", "అన్ని పథకాలు", "सभी योजनाएं", "تمام اسکیمیں"]
    ):
        all_schemes = [localize_scheme_dict(s, lang_code) for s in repo.list_schemes(active_only=True)]
        names = ", ".join(s.get("localized_name") or s["name"] for s in all_schemes)
        return AssistantChatResponse(
            reply_text=get_localized_text(
                {
                    "en": f"Opening Schemes Discovery. We currently evaluate 5 verified schemes: {names}.",
                    "te": f"పథకాల అన్వేషణ పేజీని తెరుస్తున్నాము. మా వద్ద 5 ధృవీకరించబడిన పథకాలు ఉన్నాయి: {names}.",
                    "hi": f"योजना खोज पृष्ठ खोल रहे हैं। हमारे पास 5 सत्यापित योजनाएं हैं: {names}।",
                    "ur": f"اسکیم دریافت کا صفحہ کھول رہے ہیں۔ ہمارے پاس 5 تصدیق شدہ اسکیمیں ہیں: {names}۔",
                },
                lang_code,
            ),
            lang=active_lang,
            intent_classified="NAVIGATE_SCHEMES",
            action=AssistantActionDirective(action_type="NAVIGATE", target_path="/schemes"),
            referenced_schemes=all_schemes,
            provider_used="deterministic_policy_engine",
        )

    # If user asks about documents ("What documents do I need?")
    is_doc_query = any(
        kw in msg_lower
        for kw in ["document", "certificate", "papers", "పత్రాలు", "సర్టిఫికెట్", "दस्तावेज", "प्रमाण पत्र", "دستاویزات"]
    )
    if is_doc_query and target_slug:
        scheme = repo.get_scheme(target_slug)
        if scheme:
            loc_scheme = localize_scheme_dict(scheme, lang_code)
            docs = repo.get_scheme_documents(scheme["id"])
            doc_lines = "\n".join(
                [f"• {d['name']} ({d.get('requirement_type', 'MANDATORY')}): {d.get('description', '')}" for d in docs]
            )
            sname = loc_scheme.get("localized_name") or loc_scheme["name"]
            reply = get_localized_text(
                {
                    "en": f"Required official documents for {sname}:\n{doc_lines}",
                    "te": f"{sname} కోసం అవసరమైన అధికారిక పత్రాలు:\n{doc_lines}",
                    "hi": f"{sname} के लिए आवश्यक आधिकारिक दस्तावेज:\n{doc_lines}",
                    "ur": f"{sname} کے لیے درکار سرکاری دستاویزات:\n{doc_lines}",
                },
                lang_code,
            )
            return AssistantChatResponse(
                reply_text=reply,
                lang=active_lang,
                intent_classified="SCHEME_DOCUMENTS_CHECKLIST",
                action=AssistantActionDirective(action_type="NONE"),
                referenced_schemes=[loc_scheme],
                provider_used="deterministic_policy_engine",
            )

    # If user asks about a specific scheme ("Explain PM-KISAN in Telugu", "Explain this scheme", "Find scholarships")
    if target_slug:
        scheme = repo.get_scheme(target_slug)
        if scheme:
            loc_scheme = localize_scheme_dict(scheme, lang_code)
            criteria = repo.get_scheme_criteria(scheme["id"])
            assessment = evaluate_scheme_eligibility(scheme, criteria, norm_profile)
            sname = loc_scheme.get("localized_name") or loc_scheme["name"]
            sdesc = loc_scheme.get("localized_description") or loc_scheme["description"]
            docs = repo.get_scheme_documents(scheme["id"])
            doc_names = ", ".join(d["name"] for d in docs)

            reply = get_localized_text(
                {
                    "en": (
                        f"{sname}: {sdesc}\n\n"
                        f"• Your Current Profile Assessment: {assessment.overall_status.value} "
                        f"({assessment.met_count} met, {assessment.not_met_count} not met, {assessment.unknown_count} unknown).\n"
                        f"• Required Documents: {doc_names}.\n"
                        f"• Official Source: {(scheme.get('source') or {}).get('url', 'https://india.gov.in')}"
                    ),
                    "te": (
                        f"{sname}: {sdesc}\n\n"
                        f"• మీ ప్రస్తుత ప్రొఫైల్ అర్హత స్థితి: {assessment.overall_status.value} "
                        f"({assessment.met_count} నిబంధనలు సరిపోయాయి, {assessment.unknown_count} వివరాలు అవసరం).\n"
                        f"• అవసరమైన పత్రాలు: {doc_names}.\n"
                        f"• అధికారిక వెబ్సైట్: {(scheme.get('source') or {}).get('url', 'https://india.gov.in')}"
                    ),
                    "hi": (
                        f"{sname}: {sdesc}\n\n"
                        f"• आपकी वर्तमान प्रोफ़ाइल पात्रता स्थिति: {assessment.overall_status.value} "
                        f"({assessment.met_count} शर्तें पूरी हुईं, {assessment.unknown_count} अज्ञात)।\n"
                        f"• आवश्यक दस्तावेज: {doc_names}।\n"
                        f"• आधिकारिक पोर्टल: {(scheme.get('source') or {}).get('url', 'https://india.gov.in')}"
                    ),
                    "ur": (
                        f"{sname}: {sdesc}\n\n"
                        f"• آپ کی موجودہ پروفائل اہلیت: {assessment.overall_status.value}۔\n"
                        f"• مطلوبہ دستاویزات: {doc_names}۔\n"
                        f"• سرکاری پورٹل: {(scheme.get('source') or {}).get('url', 'https://india.gov.in')}"
                    ),
                },
                lang_code,
            )

            follow_up = None
            if assessment.missing_profile_fields:
                missing_str = ", ".join(assessment.missing_profile_fields[:3])
                follow_up = get_localized_text(
                    {
                        "en": f"To complete your eligibility check for {sname}, please share or update: {missing_str}.",
                        "te": f"మీ పూర్తి అర్హతను నిర్ధారించడానికి దయచేసి ఈ వివరాలను అందించండి: {missing_str}.",
                        "hi": f"अपनी पात्रता जांच पूरी करने के लिए कृपया ये विवरण बताएं: {missing_str}।",
                        "ur": f"اپنی اہلیت کی جانچ مکمل کرنے کے لیے براہ کرم یہ تفصیلات فراہم کریں: {missing_str}۔",
                    },
                    lang_code,
                )

            return AssistantChatResponse(
                reply_text=reply,
                lang=active_lang,
                intent_classified="SCHEME_EXPLANATION_AND_ELIGIBILITY",
                action=AssistantActionDirective(action_type="NONE"),
                referenced_schemes=[loc_scheme],
                follow_up_question=follow_up,
                provider_used="deterministic_policy_engine",
            )

    # ------------------------------------------------------------------
    # 4. General Eligibility / Profile Discovery Query
    # ------------------------------------------------------------------
    if any(
        kw in msg_lower
        for kw in ["eligible", "eligibility", "which scheme", "apply for", "అర్హత", "पात्रता", "اہلیت"]
    ):
        all_schemes = repo.list_schemes(active_only=True)
        matched_lines: List[str] = []
        for s in all_schemes:
            crit = repo.get_scheme_criteria(s["id"])
            ev = evaluate_scheme_eligibility(s, crit, norm_profile)
            if ev.overall_status.value in ("ELIGIBLE", "PARTIALLY_ELIGIBLE"):
                loc_s = localize_scheme_dict(s, lang_code)
                sname = loc_s.get("localized_name") or s["name"]
                matched_lines.append(f"• {sname} ({ev.overall_status.value})")

        summary_list = "\n".join(matched_lines) if matched_lines else "• Complete your age, income, state, and occupation in Citizen Profile to see exact matches."
        reply = get_localized_text(
            {
                "en": f"Based on your current Citizen Profile, here are the schemes you are Eligible or Partially Eligible for:\n{summary_list}",
                "te": f"మీ ప్రస్తుత ప్రొఫైల్ ఆధారంగా మీరు అర్హత కలిగిన పథకాలు:\n{summary_list}",
                "hi": f"आपकी वर्तमान नागरिक प्रोफ़ाइल के आधार पर संभावित पात्र योजनाएं:\n{summary_list}",
                "ur": f"آپ کے موجودہ پروفائل کے مطابق ممکنہ طور پر اہل اسکیمیں:\n{summary_list}",
            },
            lang_code,
        )
        return AssistantChatResponse(
            reply_text=reply,
            lang=active_lang,
            intent_classified="PROFILE_ELIGIBILITY_SUMMARY",
            action=AssistantActionDirective(action_type="NONE"),
            follow_up_question=get_localized_text(
                {
                    "en": "Which of these schemes would you like me to explain in detail, or what documents do you want to check?",
                    "te": "వీటిలో ఏ పథకం గురించి పూర్తి వివరాలు లేదా అవసరమైన పత్రాలు తెలుసుకోవాలనుకుంటున్నారు?",
                    "hi": "आप इनमें से किस योजना का विवरण या आवश्यक दस्तावेज जानना चाहते हैं?",
                    "ur": "آپ ان میں سے کس اسکیم کی تفصیلات یا دستاویزات جاننا چاہتے ہیں؟",
                },
                lang_code,
            ),
            provider_used="deterministic_policy_engine",
        )

    # ------------------------------------------------------------------
    # 5. Polite Scope Guardrail for Unrelated Queries
    # ------------------------------------------------------------------
    return AssistantChatResponse(
        reply_text=get_localized_text(
            {
                "en": (
                    "I am PolicyPilot's evidence-grounded policy assistant. I can help you:\n"
                    "1. Explain schemes (PM-KISAN, AB-PMJAY, PMAY-G, NSP Post-Matric SC Scholarship, Telangana Rythu Bharosa).\n"
                    "2. Check your eligibility and required official documents.\n"
                    "3. Diagnose 'Defective' NSP scholarship or PFMS bank rejections in Rescue Mode.\n"
                    "4. Check verified government scheme announcements.\n"
                    "Try asking: 'Explain PM-KISAN in Telugu' or 'Why was my scholarship application marked defective?'"
                ),
                "te": (
                    "నేను PolicyPilot సహాయకుడిని. నేను మీకు ఈ విషయాలలో సహాయం చేయగలను:\n"
                    "1. ప్రభుత్వ పథకాల వివరాలు (PM-KISAN, AB-PMJAY, PMAY-G, NSP స్కాలర్షిప్, తెలంగాణ రైతు భరోసా).\n"
                    "2. మీ అర్హత మరియు అవసరమైన అధికారిక సర్టిఫికెట్ల తనిఖీ.\n"
                    "3. స్కాలర్షిప్ 'Defective' లేదా PFMS బ్యాంక్ సమస్యల పరిష్కారం (Rescue Mode).\n"
                    "ఉదాహరణకు ఇలా అడగండి: 'PM-KISAN గురించి తెలుగులో వివరించండి' లేదా 'నా స్కాలర్షిప్ అప్లికేషన్ ఎందుకు Defective అయింది?'"
                ),
                "hi": (
                    "मैं PolicyPilot का प्रमाण-आधारित सहायक हूँ। मैं आपकी इन कार्यों में सहायता कर सकता हूँ:\n"
                    "1. सरकारी योजनाओं की जानकारी (PM-KISAN, AB-PMJAY, PMAY-G, NSP पोस्ट-मैट्रिक छात्रवृत्ति, तेलंगाना रायथू भरोसा)।\n"
                    "2. आपकी पात्रता और आवश्यक दस्तावेजों की जांच।\n"
                    "3. NSP छात्रवृत्ति 'Defective' या PFMS बैंक अस्वीकृति का समाधान (Rescue Mode)।\n"
                    "पूछने का प्रयास करें: 'NSP छात्रवृत्ति के लिए कौन से दस्तावेज चाहिए?' या 'मेरा आवेदन डिफेक्टिव क्यों हुआ?'"
                ),
                "ur": (
                    "میں PolicyPilot کا معاون ہوں۔ میں آپ کی ان کاموں میں مدد کر سکتا ہوں:\n"
                    "1. سرکاری اسکیموں کی تفصیلات (PM-KISAN, AB-PMJAY, PMAY-G, NSP اسکالرشپ، تلنگانہ رعیتو بھروسہ)۔\n"
                    "2. اہلیت اور ضروری دستاویزات کی جانچ۔\n"
                    "3. اسکالرشپ کی خرابیوں (Defective) کا حل (Rescue Mode)۔"
                ),
            },
            lang_code,
        ),
        lang=active_lang,
        intent_classified="SCOPE_GUIDANCE",
        action=AssistantActionDirective(action_type="NONE"),
        provider_used="deterministic_policy_engine",
    )
