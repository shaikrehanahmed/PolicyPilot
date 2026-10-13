import asyncio
import logging
import time
from typing import Tuple

from app.core.config import settings

logger = logging.getLogger("policypilot.ai.provider_health")

_last_probe_time: float = 0.0
_cached_status: Tuple[str, bool] = ("deterministic_fallback (no key configured)", False)
_CACHE_TTL_SECONDS: float = 60.0


async def check_gemini_provider_health(force_refresh: bool = False) -> Tuple[str, bool]:
    """Inspects real Gemini provider connectivity.
    Guarantees:
    - Never displays API key or secrets.
    - If key is absent: returns deterministic_fallback (blocked_no_credentials).
    - If key is present: performs real provider probe and only marks connected if successful.
    - Never treats mocked tests or config strings as proof of live inference.
    """
    global _last_probe_time, _cached_status

    now = time.time()
    if not force_refresh and (now - _last_probe_time) < _CACHE_TTL_SECONDS:
        return _cached_status

    api_key = settings.effective_gemini_api_key
    if not api_key or not api_key.strip():
        _cached_status = ("deterministic_fallback", False)
        _last_probe_time = now
        return _cached_status

    # Real provider probe using official google-genai SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        probe_models = [settings.llm_model]
        for candidate in ["gemini-2.5-flash", "gemini-2.0-flash"]:
            if candidate not in probe_models:
                probe_models.append(candidate)

        probe_succeeded = False
        quota_hit = False
        for pm in probe_models:
            try:
                resp = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=pm,
                        contents="Reply ping",
                        config=types.GenerateContentConfig(max_output_tokens=5),
                    ),
                    timeout=4.0,
                )
                if resp and resp.text and resp.text.strip():
                    probe_succeeded = True
                    break
            except Exception as pe:
                err_str = str(pe)
                err_type = type(pe).__name__
                # Safe error diagnosis from metadata without logging keys or raw query URLs
                if (
                    "RESOURCE_EXHAUSTED" in err_str
                    or "429" in err_str
                    or "QuotaExceeded" in err_str
                    or "quota" in err_str.lower()
                    or "rate limit" in err_str.lower()
                ):
                    quota_hit = True
                    logger.info(f"Gemini probe on {pm}: quota/rate limit threshold reached ({err_type})")
                    break
                else:
                    logger.debug(f"Probe on {pm} failed: {err_type}")

        if probe_succeeded:
            _cached_status = ("connected", True)
        elif quota_hit:
            _cached_status = ("deterministic_fallback (quota_exhausted)", False)
        else:
            _cached_status = ("deterministic_fallback (probe_unsuccessful)", False)
    except Exception as e:
        logger.warning(f"Gemini live probe error: {type(e).__name__}")
        _cached_status = ("deterministic_fallback (network_error)", False)

    _last_probe_time = now
    return _cached_status
