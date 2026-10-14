from .action_plan import router as action_plan_router
from .announcements import router as announcements_router
from .assistant import router as assistant_router
from .eligibility import router as eligibility_router
from .health import router as health_router
from .profile import router as profile_router
from .rescue import router as rescue_router
from .schemes import router as schemes_router
from .sources import router as sources_router
from .tts import router as tts_router
from .workflow import router as workflow_router

__all__ = [
    "action_plan_router",
    "announcements_router",
    "assistant_router",
    "eligibility_router",
    "health_router",
    "profile_router",
    "rescue_router",
    "schemes_router",
    "sources_router",
    "tts_router",
    "workflow_router",
]
