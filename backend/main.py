import logging
import sys

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.config import settings
from middleware.timing import TimingMiddleware
from middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from routes.review import router as review_router
from routes.chat import router as chat_router
from routes.github_review import router as github_router
from routes.github_webhook import router as webhook_router
from routes.auth import router as auth_router
from routes.history import router as history_router

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Code Reviewer API",
    description=(
        "A FastAPI backend that accepts source code and returns AI-powered review feedback "
        "including bug detection, optimization suggestions, improved code, and explanations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow the React frontend to call this API in development
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Performance: request timing (logs + X-Response-Time header)
# ---------------------------------------------------------------------------

app.add_middleware(TimingMiddleware)

# ---------------------------------------------------------------------------
# Structured error responses — all errors → {"status": "error", "message": "…"}
# ---------------------------------------------------------------------------

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(review_router)
app.include_router(chat_router)
app.include_router(github_router)
app.include_router(webhook_router)
app.include_router(auth_router)
app.include_router(history_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"], summary="Health check")
async def health_check() -> dict:
    from core.cache import review_cache
    provider = settings.ai_provider.lower()
    mock_mode = settings.use_mock or (
        provider == "openai" and not settings.openai_api_key
    ) or (
        provider != "openai" and not settings.gemini_api_key
    )

    if settings.use_mock:
        ai_mode = "mock"
    elif provider == "openai":
        ai_mode = f"openai ({settings.openai_model})" if settings.openai_api_key else "mock (no OPENAI_API_KEY)"
    else:
        ai_mode = f"gemini ({settings.gemini_model})" if settings.gemini_api_key else "mock (no GEMINI_API_KEY)"

    return {
        "status": "ok",
        "version": "1.0.0",
        "ai_provider": provider,
        "ai_mode": ai_mode,
        "mock_mode": mock_mode,
        "cache": review_cache.stats(),
    }


@app.delete("/api/cache", tags=["health"], summary="Flush the review cache")
async def flush_cache() -> dict:
    """Clear all cached code reviews (admin / dev utility)."""
    from core.cache import review_cache
    await review_cache.clear()
    return {"status": "ok", "message": "Review cache cleared."}


# ---------------------------------------------------------------------------
# Startup log
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    # Create all database tables (idempotent — won't overwrite existing data)
    from database import engine, Base
    import models.db_models  # noqa: F401 — must import models to register them
    Base.metadata.create_all(bind=engine)

    provider = settings.ai_provider.lower()
    if settings.use_mock:
        mode = "MOCK"
    elif provider == "openai":
        mode = f"OPENAI ({settings.openai_model})" if settings.openai_api_key else "MOCK (no OPENAI_API_KEY set)"
    else:
        mode = f"GEMINI ({settings.gemini_model})" if settings.gemini_api_key else "MOCK (no GEMINI_API_KEY set)"
    logger.info("AI Code Reviewer API started — AI mode: %s", mode)
    logger.info("Interactive docs: http://localhost:8000/docs")
