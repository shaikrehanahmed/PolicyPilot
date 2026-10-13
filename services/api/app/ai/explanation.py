import asyncio
import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger("policypilot.ai.explanation")


def generate_deterministic_explanation(
    scheme_name: str,
    status: str,
    met_count: int,
    not_met_count: int,
    unknown_count: int,
    missing_fields: List[str],
    criteria_results: List[Dict[str, Any]],
    sources: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generates an honest, auditable deterministic explanation when LLM is unavailable.
    Clearly marks is_fallback=True so the UI/API never misleads the citizen.
    """
    lines = []
    if status == "ELIGIBLE":
        lines.append(
            f"Based on the official eligibility guidelines, you appear eligible for {scheme_name}."
        )
        lines.append(f"All {met_count} required criteria evaluated were met by your provided profile.")
    elif status == "PARTIALLY_ELIGIBLE":
        lines.append(
            f"Your eligibility assessment for {scheme_name} is currently incomplete."
        )
        lines.append(f"{met_count} criteria were met, but {unknown_count} criteria require additional demographic data.")
        if missing_fields:
            fields_str = ", ".join(f"'{f}'" for f in missing_fields)
            lines.append(f"Missing attributes needed for a conclusive assessment: {fields_str}.")
    elif status == "NOT_ELIGIBLE":
        lines.append(
            f"Based on the official rules, you do not currently meet the eligibility requirements for {scheme_name}."
        )
        failed_criteria = [
            f"{c.get('criterion_key')}: {c.get('reason')}"
            for c in criteria_results
            if c.get("status") == "not_met" and c.get("required", True)
        ]
        if failed_criteria:
            lines.append("Disqualifying condition(s): " + "; ".join(failed_criteria) + ".")
    else:
        lines.append(f"Eligibility for {scheme_name} could not be determined from the available data.")

    # Add source provenance mention
    if sources:
        src_names = [s.get("title") or s.get("name") or "official portal" for s in sources[:2]]
        lines.append(f"Criteria verified against official source: {', '.join(src_names)}.")

    text = " ".join(lines)
    return {
        "text": text,
        "provider": "deterministic_fallback",
        "model": "none",
        "is_fallback": True,
        "note": "Deterministic fallback mode — no GEMINI_API_KEY configured or live call bypassed",
    }


async def generate_explanation(
    scheme_name: str,
    status: str,
    met_count: int,
    not_met_count: int,
    unknown_count: int,
    missing_fields: List[str],
    criteria_results: List[Dict[str, Any]],
    sources: List[Dict[str, Any]],
    evidence_quotes: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generates a plain-English explanation.
    Uses Gemini 3.8 Flash if GEMINI_API_KEY is configured and reachable.
    Otherwise falls back transparently to deterministic explanation.
    """
    api_key = settings.effective_gemini_api_key

    # If no key, return deterministic fallback immediately
    if not api_key or api_key.strip() == "":
        return generate_deterministic_explanation(
            scheme_name=scheme_name,
            status=status,
            met_count=met_count,
            not_met_count=not_met_count,
            unknown_count=unknown_count,
            missing_fields=missing_fields,
            criteria_results=criteria_results,
            sources=sources,
        )

    # Attempt live call using official google-genai SDK
    prompt = f"""You are PolicyPilot's evidence explanation assistant.
Explain the following eligibility evaluation to a citizen in plain, respectful, concise English (2-3 short paragraphs max).

RULES:
1. Ground your explanation strictly on the provided evaluation results and official excerpts.
2. DO NOT promise government approval. All assessments are preliminary and require verification on official portals.
3. If status is NOT_ELIGIBLE, explain why kindly based on the exact rule.
4. If status is PARTIALLY_ELIGIBLE, tell them what information is missing.
5. If status is ELIGIBLE, summarize the criteria met and remind them to apply via the official government portal.

SCHEME: {scheme_name}
EVALUATION STATUS: {status}
MET CRITERIA ({met_count}): {[c.get('criterion_key') for c in criteria_results if c.get('status') == 'met']}
NOT MET CRITERIA ({not_met_count}): {[f"{c.get('criterion_key')}: {c.get('reason')}" for c in criteria_results if c.get('status') == 'not_met']}
UNKNOWN / MISSING CRITERIA ({unknown_count}): {missing_fields}
OFFICIAL SOURCES: {[s.get('title') for s in sources]}
OFFICIAL EVIDENCE EXCERPTS: {evidence_quotes or []}
"""

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        # Cascade through candidate flash models if primary encounters temporary capacity spikes (e.g. 503)
        candidate_models = [settings.llm_model]
        for fallback_m in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        for m_name in candidate_models:
            try:
                resp = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=m_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.2,
                            max_output_tokens=400,
                        ),
                    ),
                    timeout=5.0,
                )
                if resp and resp.text and resp.text.strip():
                    explanation_text = resp.text.strip()
                    return {
                        "text": explanation_text,
                        "provider": "gemini",
                        "model": m_name,
                        "is_fallback": False,
                        "note": f"Live explanation synthesized by {m_name}",
                    }
            except Exception as model_err:
                logger.warning(
                    f"Gemini call to {m_name} failed: {type(model_err).__name__}. Trying next candidate model."
                )
                if "RESOURCE_EXHAUSTED" in str(model_err) or "429" in str(model_err):
                    # Free tier quota exhausted — stop further candidate attempts and revert to fallback immediately
                    break
    except Exception as e:
        logger.warning(f"Failed to query Gemini API via SDK: {type(e).__name__}. Reverting to deterministic fallback.")

    # On any error, return deterministic fallback
    fallback = generate_deterministic_explanation(
        scheme_name=scheme_name,
        status=status,
        met_count=met_count,
        not_met_count=not_met_count,
        unknown_count=unknown_count,
        missing_fields=missing_fields,
        criteria_results=criteria_results,
        sources=sources,
    )
    fallback["note"] = "Deterministic fallback mode — Gemini API call unverified or error occurred"
    return fallback
