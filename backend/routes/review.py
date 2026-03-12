"""
POST /api/review — AI Code Review endpoint.

Performance optimisations applied
-----------------------------------
1. Async endpoint — never blocks the event loop.
2. Parallel execution — static analysis and AI review run concurrently via
   asyncio.gather() + asyncio.to_thread() (sync services run in the thread pool).
3. Result caching — identical (language, code) pairs are served from an in-memory
   TTL cache (5-min TTL, 200-entry cap). Cache key = SHA-256 of inputs.
4. Per-request timing is logged via TimingMiddleware (registered in main.py).

Error handling
--------------
* ValueError  (bad input / unparseable AI response) → 422 Unprocessable Entity
* RuntimeError (AI service down / rate-limited)      → 503 Service Unavailable
* All other exceptions                               → 500 (caught by global handler)
All errors are serialised as {"status": "error", "message": "..."} by the global
exception handlers registered in main.py.
"""

import asyncio
import logging
import time

from fastapi import APIRouter, HTTPException, status

from core.cache import review_cache
from core.config import settings
from models.schemas import FullReviewResponse, ReviewRequest
from services.ai_reviewer import review_code_openai
from services.gemini_service import review_code as review_code_gemini
from services.static_analysis import run_static_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["review"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _run_ai_review(language: str, code: str):
    """
    Dispatch AI review to the configured provider, running the synchronous
    service function in a thread pool so the event loop stays free.
    Checks the cache before dispatching and stores the result afterwards.
    """
    # --- Cache look-up -------------------------------------------------------
    cached = await review_cache.get(language, code)
    if cached is not None:
        logger.info(
            "Review cache HIT [language=%s, cache_size=%d]",
            language, review_cache.size,
        )
        return cached, True  # (result, from_cache)

    # --- AI dispatch ---------------------------------------------------------
    provider = settings.ai_provider.lower()
    if provider == "openai":
        logger.info("Dispatching review to OpenAI [language=%s]", language)
        result = await asyncio.to_thread(
            review_code_openai, language=language, code=code
        )
    else:
        logger.info("Dispatching review to Gemini [language=%s]", language)
        result = await asyncio.to_thread(
            review_code_gemini, language=language, code=code
        )

    # --- Cache store ---------------------------------------------------------
    await review_cache.set(language, code, result)
    return result, False  # (result, from_cache)


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post(
    "/review",
    response_model=FullReviewResponse,
    summary="Review source code with AI + static analysis",
    description=(
        "Accepts source code and a programming language. "
        "Runs a static linter (pylint / ESLint) and AI analysis **in parallel**, "
        "then returns a combined `FullReviewResponse`. "
        "Repeated identical requests are served from an in-memory cache (5-min TTL)."
    ),
    status_code=status.HTTP_200_OK,
)
async def review_code_endpoint(request: ReviewRequest) -> FullReviewResponse:
    """
    POST /api/review

    Request body:
        language  — one of: python | javascript | java | cpp
        code      — source code to review (1 – 20,000 characters)

    Returns:
        static_analysis  — linter findings (pylint / ESLint)
        ai_review        — structured AI analysis (issues, performance, security,
                           suggestions, improved_code, explanation, complexity)
    """
    t_start = time.perf_counter()
    lang = request.language.value

    logger.info(
        "Review request [provider=%s, language=%s, code_len=%d]",
        settings.ai_provider, lang, len(request.code),
    )

    try:
        # ── Run static analysis + AI review concurrently ─────────────────────
        static_task = asyncio.to_thread(
            run_static_analysis, language=lang, code=request.code
        )
        ai_task = _run_ai_review(language=lang, code=request.code)

        (static_findings, (ai_result, from_cache)) = await asyncio.gather(
            static_task, ai_task
        )

        elapsed_ms = (time.perf_counter() - t_start) * 1_000
        logger.info(
            "Review complete [language=%s, static=%d, cache=%s, elapsed=%.0f ms]",
            lang, len(static_findings), from_cache, elapsed_ms,
        )

        return FullReviewResponse(
            static_analysis=static_findings,
            ai_review=ai_result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error during code review")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        ) from exc
