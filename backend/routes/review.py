import logging

from fastapi import APIRouter, HTTPException, status

from core.config import settings
from models.schemas import ReviewRequest, FullReviewResponse
from services.ai_reviewer import review_code_openai
from services.gemini_service import review_code as review_code_gemini
from services.static_analysis import run_static_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["review"])


def _dispatch_review(language: str, code: str):
    """
    Route the review request to the correct AI provider based on AI_PROVIDER setting.
    - 'openai'  → OpenAI Chat Completions (ai_reviewer.py)
    - 'gemini'  → Google Gemini (gemini_service.py)
    Mock mode is handled inside each service.
    """
    provider = settings.ai_provider.lower()
    if provider == "openai":
        logger.info("Dispatching to OpenAI provider")
        return review_code_openai(language=language, code=code)
    else:
        logger.info("Dispatching to Gemini provider")
        return review_code_gemini(language=language, code=code)


@router.post(
    "/review",
    response_model=FullReviewResponse,
    summary="Review source code with AI + static analysis",
    description=(
        "Accepts source code and a programming language. Runs a static linter first "
        "(pylint for Python, ESLint for JavaScript), then sends the code to the configured "
        "AI provider (OpenAI or Gemini). Returns a combined response with linter findings "
        "under `static_analysis` and the full AI analysis under `ai_review`."
    ),
    status_code=status.HTTP_200_OK,
)
async def review_code_endpoint(request: ReviewRequest) -> FullReviewResponse:
    """
    POST /api/review

    Request body:
        language  (string) — one of: python | javascript | java | cpp
        code      (string) — source code to review (max 20,000 characters)

    Returns:
        static_analysis  — list of linter findings (line, column, severity, code, message, tool)
        ai_review        — full AI structured review (issues, performance_issues,
                           security_issues, suggestions, improved_code, explanation, complexity)
    """
    logger.info(
        "Review request received [provider=%s, language=%s, code_length=%d]",
        settings.ai_provider,
        request.language.value,
        len(request.code),
    )

    try:
        # ── 1. Static analysis (fast, runs locally) ──────────────────────────
        static_findings = run_static_analysis(
            language=request.language.value,
            code=request.code,
        )
        logger.info(
            "Static analysis complete [language=%s, findings=%d]",
            request.language.value,
            len(static_findings),
        )

        # ── 2. AI review ─────────────────────────────────────────────────────
        ai_result = _dispatch_review(
            language=request.language.value,
            code=request.code,
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
