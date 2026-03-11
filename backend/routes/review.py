import logging

from fastapi import APIRouter, HTTPException, status

from models.schemas import ReviewRequest, ReviewResponse
from services.gemini_service import review_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["review"])


@router.post(
    "/review",
    response_model=ReviewResponse,
    summary="Review source code with AI",
    description=(
        "Accepts source code and a programming language, sends it to the AI service, "
        "and returns structured feedback including bugs, optimizations, improved code, "
        "and an explanation of the changes."
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
        bugs           — list of detected issues
        optimizations  — list of improvement suggestions
        improved_code  — rewritten version of the code
        explanation    — explanation of all changes made
    """
    logger.info(
        "Review request received [language=%s, code_length=%d]",
        request.language.value,
        len(request.code),
    )

    try:
        result = review_code(
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
