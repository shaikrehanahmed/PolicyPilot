from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .rescue import SupportedLanguage


class AssistantMessageItem(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str
    timestamp: Optional[str] = None


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=600)
    lang: SupportedLanguage = Field(default=SupportedLanguage.EN)
    current_path: Optional[str] = Field(default="/")
    current_scheme_slug: Optional[str] = Field(default=None)
    profile: Dict[str, Any] = Field(default_factory=dict)
    history: List[AssistantMessageItem] = Field(default_factory=list)


class AssistantActionDirective(BaseModel):
    """Explicit client action ONLY when user intent is unambiguous."""

    action_type: str = Field(
        default="NONE",
        description="NONE | NAVIGATE | GO_BACK | STOP_AUDIO | SWITCH_LANGUAGE",
    )
    target_path: Optional[str] = None
    target_lang: Optional[SupportedLanguage] = None


class AssistantChatResponse(BaseModel):
    status: str = "SUCCESS"
    reply_text: str
    lang: SupportedLanguage
    intent_classified: str
    action: AssistantActionDirective
    referenced_schemes: List[Dict[str, Any]] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_question: Optional[str] = None
    provider_used: str = Field(
        description="'gemini_live_grounded' or 'deterministic_policy_engine'"
    )
    is_fallback: bool = True


class TTSCapabilitiesOut(BaseModel):
    configured_provider: str
    cloud_tts_ready: bool
    model_id: str
    supported_languages: Dict[str, Dict[str, Any]]
    configuration_note: str


class TTSSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2500)
    lang: SupportedLanguage = Field(default=SupportedLanguage.EN)


class TTSSynthesizeResponse(BaseModel):
    status: str
    lang: SupportedLanguage
    provider_used: str
    cloud_audio_available: bool
    audio_base64: Optional[str] = None
    mime_type: str = "audio/mpeg"
    text_chunks: List[str] = Field(default_factory=list)
    limitation_notice: Optional[str] = None
