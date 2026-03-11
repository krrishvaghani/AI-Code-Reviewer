import logging

from fastapi import APIRouter, HTTPException, status

from models.schemas import GithubReviewRequest, GithubReviewResponse
from services.github_service import review_github_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["github"])


@router.post(
    "/github-review",
    response_model=GithubReviewResponse,
    summary="Review a public GitHub repository",
    description=(
        "Accepts a public GitHub repository URL, fetches its source files, "
        "and returns an AI-powered analysis of the overall code quality, "
        "structure, top issues, and per-file feedback."
    ),
    status_code=status.HTTP_200_OK,
)
async def github_review_endpoint(request: GithubReviewRequest) -> GithubReviewResponse:
    """
    POST /api/github-review

    Request body:
        repo_url (string) — https://github.com/owner/repo

    Returns:
        repo_name          — "owner/repo"
        files_analyzed     — number of files reviewed
        structure_summary  — overview of what the repo does
        overall_quality    — Excellent | Good | Needs Improvement | Poor
        top_issues         — cross-cutting issues found
        top_suggestions    — high-impact improvement ideas
        file_reviews       — per-file issues and suggestions
    """
    logger.info("GitHub review request: %s", request.repo_url)

    try:
        result = review_github_repo(repo_url=request.repo_url)
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
        logger.exception("Unexpected error in github review endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        ) from exc
