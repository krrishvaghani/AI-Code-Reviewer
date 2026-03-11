import logging

from fastapi import APIRouter, HTTPException, status

from core.config import settings
from models.schemas import ReviewRequest, ReviewResponse
from services.ai_reviewer import review_code_openai
from services.gemini_service import review_code as review_code_gemini

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["review"])


def _dispatch_review(language: str, code: str) -> ReviewResponse:
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
    response_model=ReviewResponse,
    summary="Review source code with AI",
    description=(
        "Accepts source code and a programming language, sends it to the configured "
        "AI provider (OpenAI or Gemini), and returns structured feedback including "
        "issues, suggestions, improved code, and an explanation."
    ),
    status_code=status.HTTP_200_OK,
)
async def review_code_endpoint(request: ReviewRequest) -> ReviewResponse:
    """
    POST /api/review

    Request body:
        language  (string) — one of: python | javascript | java | cpp
        code      (string) — source code to review (max 20,000 characters)

    Returns:
        issues         — list of detected bugs and code smells
        suggestions    — list of optimization and improvement suggestions
        improved_code  — rewritten version of the code
        explanation    — explanation of all changes made
    """
    logger.info(
        "Review request received [provider=%s, language=%s, code_length=%d]",
        settings.ai_provider,
        request.language.value,
        len(request.code),
    )

    try:
        result = _dispatch_review(
            language=request.language.value,
            code=request.code,
        )
        return result

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
