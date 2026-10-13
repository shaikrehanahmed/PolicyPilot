import logging
import time
from typing import Tuple

import httpx

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

    # Real provider probe against current official model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.llm_model}?key={api_key}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                _cached_status = ("connected", True)
            else:
                logger.warning(f"Gemini probe returned status {resp.status_code}")
                _cached_status = (f"deterministic_fallback (http_{resp.status_code})", False)
    except Exception as e:
        logger.warning(f"Gemini live probe error: {e}")
        _cached_status = ("deterministic_fallback (network_error)", False)

    _last_probe_time = now
    return _cached_status
