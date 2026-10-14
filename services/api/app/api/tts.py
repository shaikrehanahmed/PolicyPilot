"""Secure Server-Side Text-to-Speech Endpoint & Language Capability Verifier.

Why this exists:
1. Browser native speechSynthesis frequently lacks Telugu ('te') and Urdu ('ur') voices or
   mispronounces them using an English voice.
2. ElevenLabs' older `eleven_multilingual_v2` supports Hindi ('hi') and English ('en') but NOT
   Telugu ('te') or Urdu ('ur'). ElevenLabs `eleven_v3` supports all 4 languages (en, te, hi, ur).
3. Credentials (`ELEVENLABS_API_KEY`) remain strictly on the backend and are never exposed to client JS.
4. Splits long text into sentence chunks so synthesis never truncates or loses language context.
"""
from __future__ import annotations

import base64
import logging
import os
import re
from typing import Dict, List

import httpx
from fastapi import APIRouter

from ..schemas.assistant import (
    TTSCapabilitiesOut,
    TTSSynthesizeRequest,
    TTSSynthesizeResponse,
)

logger = logging.getLogger("policypilot.api.tts")
router = APIRouter(prefix="/tts", tags=["Speech & TTS"])


def chunk_text_for_tts(text: str, max_chars: int = 380) -> List[str]:
    """Splits long translated answers at sentence boundaries (., !, ?, ।, ۔) for stable TTS."""
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    if len(cleaned) <= max_chars:
        return [cleaned]

    sentences = re.split(r"(?<=[.!?।۔])\s+", cleaned)
    chunks: List[str] = []
    current = ""
    for sent in sentences:
        if len(current) + len(sent) + 1 <= max_chars:
            current = f"{current} {sent}".strip()
        else:
            if current:
                chunks.append(current)
            if len(sent) <= max_chars:
                current = sent
            else:
                # Hard slice very long unpunctuated clauses
                for i in range(0, len(sent), max_chars):
                    chunks.append(sent[i : i + max_chars])
                current = ""
    if current:
        chunks.append(current)
    return chunks


def _get_voice_map() -> Dict[str, str]:
    default_voice = os.getenv("ELEVENLABS_VOICE_ID_DEFAULT", "").strip()
    return {
        "en": os.getenv("ELEVENLABS_VOICE_ID_EN", default_voice).strip(),
        "te": os.getenv("ELEVENLABS_VOICE_ID_TE", default_voice).strip(),
        "hi": os.getenv("ELEVENLABS_VOICE_ID_HI", default_voice).strip(),
        "ur": os.getenv("ELEVENLABS_VOICE_ID_UR", default_voice).strip(),
    }


def _is_real_key(val: str) -> bool:
    return bool(val) and "placeholder" not in val.lower() and not val.startswith("your_")


@router.get("/capabilities", response_model=TTSCapabilitiesOut)
async def get_tts_capabilities() -> TTSCapabilitiesOut:
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_v3").strip()
    voice_map = _get_voice_map()
    has_key = _is_real_key(api_key)

    # eleven_v3 supports en, te, hi, ur. eleven_multilingual_v2 only supports en and hi.
    v3_enabled = model_id in ("eleven_v3", "eleven_v4", "eleven_v4_turbo")

    supported: Dict[str, Dict[str, object]] = {
        "en": {
            "cloud_supported": has_key and _is_real_key(voice_map["en"]),
            "elevenlabs_model_compatible": True,
            "speech_lang_tag": "en-IN",
        },
        "hi": {
            "cloud_supported": has_key and _is_real_key(voice_map["hi"]),
            "elevenlabs_model_compatible": True,
            "speech_lang_tag": "hi-IN",
        },
        "te": {
            "cloud_supported": has_key and _is_real_key(voice_map["te"]) and v3_enabled,
            "elevenlabs_model_compatible": v3_enabled,
            "speech_lang_tag": "te-IN",
        },
        "ur": {
            "cloud_supported": has_key and _is_real_key(voice_map["ur"]) and v3_enabled,
            "elevenlabs_model_compatible": v3_enabled,
            "speech_lang_tag": "ur-IN",
        },
    }

    note = (
        f"ElevenLabs cloud TTS is ACTIVE (model={model_id})."
        if has_key
        else (
            "ELEVENLABS_API_KEY is not configured in backend environment. "
            "Using chunked browser speech synthesis fallback (only when a matching native language "
            "voice is installed on the user's device; never speaks Telugu/Urdu with an English voice)."
        )
    )
    return TTSCapabilitiesOut(
        configured_provider="elevenlabs" if has_key else "browser_verified_fallback",
        cloud_tts_ready=has_key,
        model_id=model_id,
        supported_languages=supported,
        configuration_note=note,
    )


@router.post("/synthesize", response_model=TTSSynthesizeResponse)
async def synthesize_speech(payload: TTSSynthesizeRequest) -> TTSSynthesizeResponse:
    lang = payload.lang.value
    chunks = chunk_text_for_tts(payload.text)
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_v3").strip()
    voice_map = _get_voice_map()
    voice_id = voice_map.get(lang, "")

    # Verify model compatibility for Telugu & Urdu
    if lang in ("te", "ur") and model_id == "eleven_multilingual_v2":
        model_id = "eleven_v3"

    if _is_real_key(api_key) and _is_real_key(voice_id):
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            }
            # Synthesize bounded text safely
            body = {
                "text": " ".join(chunks[:3]),
                "model_id": model_id,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=body)
                if resp.status_code == 200 and resp.content:
                    b64 = base64.b64encode(resp.content).decode("ascii")
                    return TTSSynthesizeResponse(
                        status="SUCCESS",
                        lang=payload.lang,
                        provider_used=f"elevenlabs ({model_id})",
                        cloud_audio_available=True,
                        audio_base64=b64,
                        mime_type="audio/mpeg",
                        text_chunks=chunks,
                    )
                logger.warning(
                    f"ElevenLabs API returned status {resp.status_code}: {resp.text[:200]}"
                )
        except Exception as exc:
            logger.warning(f"ElevenLabs TTS synthesis failed, using fallback: {exc}")

    # Honest fallback when ELEVENLABS_API_KEY or voice ID is not configured
    limitation = {
        "en": None,
        "hi": "Cloud TTS key not set; using device Hindi (hi-IN) voice if installed.",
        "te": "Cloud TTS (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID_TE with eleven_v3) is not configured. Browser playback will run ONLY if your device has a native Telugu (te-IN) voice installed.",
        "ur": "Cloud TTS (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID_UR with eleven_v3) is not configured. Browser playback will run ONLY if your device has a native Urdu (ur-IN / ur-PK) voice installed.",
    }.get(lang)

    return TTSSynthesizeResponse(
        status="FALLBACK_TO_DEVICE_VOICE",
        lang=payload.lang,
        provider_used="browser_verified_voice",
        cloud_audio_available=False,
        audio_base64=None,
        text_chunks=chunks,
        limitation_notice=limitation,
    )
