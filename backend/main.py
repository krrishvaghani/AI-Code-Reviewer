import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routes.review import router as review_router

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
# Routers
# ---------------------------------------------------------------------------

app.include_router(review_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"], summary="Health check")
async def health_check() -> dict:
    return {
        "status": "ok",
        "version": "1.0.0",
        "ai_mode": "mock" if settings.use_mock or not settings.gemini_api_key else "gemini",
    }


# ---------------------------------------------------------------------------
# Startup log
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    mode = "MOCK" if settings.use_mock or not settings.gemini_api_key else f"GEMINI ({settings.gemini_model})"
    logger.info("AI Code Reviewer API started — AI mode: %s", mode)
    logger.info("Interactive docs: http://localhost:8000/docs")
