import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import (
    action_plan_router,
    announcements_router,
    assistant_router,
    eligibility_router,
    health_router,
    profile_router,
    rescue_router,
    schemes_router,
    sources_router,
    tts_router,
    workflow_router,
)
from .core.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("policypilot.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events: startup and shutdown."""
    logger.info(
        f"Starting {settings.app_name} v{settings.app_version} "
        f"[env={settings.environment}, demo_mode={settings.demo_mode}]"
    )
    yield
    logger.info(f"Shutting down {settings.app_name}")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Evidence-Grounded Policy Navigation API with Deterministic Rules Engine",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred. System remains in safe state.",
            "detail": str(exc) if settings.debug else None,
        },
    )


# Include API Routers
app.include_router(health_router, prefix="/api")
app.include_router(health_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(eligibility_router, prefix="/api/v1")
app.include_router(sources_router, prefix="/api/v1")
app.include_router(action_plan_router, prefix="/api/v1")
app.include_router(workflow_router, prefix="/api/v1")
app.include_router(rescue_router, prefix="/api/v1")
app.include_router(announcements_router, prefix="/api/v1")
app.include_router(assistant_router, prefix="/api/v1")
app.include_router(tts_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "docs": "/docs" if settings.debug else None,
    }
