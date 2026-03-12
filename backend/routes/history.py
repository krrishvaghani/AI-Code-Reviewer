"""
Review history routes — store and retrieve past code reviews per user.
"""

import json
import logging
from collections import Counter, defaultdict
from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import ReviewHistory
from models.schemas import HistoryItemOut, SaveHistoryRequest, StatsResponse, LanguageStat, DailyActivity
from auth.jwt_handler import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["history"])


@router.get(
    "/history",
    response_model=List[HistoryItemOut],
    summary="List the authenticated user's review history",
)
async def get_history(
    skip:    int = 0,
    limit:   int = 30,
    user_id: int = Depends(get_current_user_id),
    db:      Session = Depends(get_db),
):
    """Return up to `limit` history records for the logged-in user, newest first."""
    rows = (
        db.query(ReviewHistory)
        .filter(ReviewHistory.user_id == user_id)
        .order_by(ReviewHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        HistoryItemOut(
            id=r.id,
            language=r.language,
            code_snippet=r.code_snippet,
            review_type=r.review_type,
            title=r.title,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post(
    "/history",
    status_code=status.HTTP_201_CREATED,
    summary="Save a new review to history",
)
async def save_history(
    body:    SaveHistoryRequest,
    user_id: int = Depends(get_current_user_id),
    db:      Session = Depends(get_db),
):
    """Persist a review result tied to the authenticated user."""
    item = ReviewHistory(
        user_id      = user_id,
        language     = body.language,
        code_snippet = (body.code or "")[:300],
        result_json  = json.dumps(body.result) if body.result else "{}",
        review_type  = body.review_type,
        title        = (body.title or f"{body.language} review")[:255],
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    logger.info("Saved history item id=%d for user_id=%d", item.id, user_id)
    return {"id": item.id}


@router.delete(
    "/history/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a history item",
)
async def delete_history(
    item_id: int,
    user_id: int = Depends(get_current_user_id),
    db:      Session = Depends(get_db),
):
    """Delete a specific history item owned by the authenticated user."""
    row = (
        db.query(ReviewHistory)
        .filter(ReviewHistory.id == item_id, ReviewHistory.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History item not found.")
    db.delete(row)
    db.commit()


# ---------------------------------------------------------------------------
# GET /api/stats
# ---------------------------------------------------------------------------

def _score_from_result(result_json_str: str) -> float:
    """
    Compute a 0–100 code quality score for a single review based on
    the number of problems found.  100 = no issues at all.

    Deductions:
        - 8 pts per AI issue (bugs / code smells)
        - 5 pts per security issue
        - 4 pts per performance issue
        - 1 pt  per static-analysis finding
    """
    try:
        data = json.loads(result_json_str or "{}")
    except (json.JSONDecodeError, TypeError):
        return 100.0   # treat unparse-able entry as clean

    ai = data.get("ai_review", data)   # support both FullReviewResponse and ReviewResponse shapes
    issues      = len(ai.get("issues", []))
    security    = len(ai.get("security_issues", []))
    performance = len(ai.get("performance_issues", []))
    static      = len(data.get("static_analysis", []))

    deduction = issues * 8 + security * 5 + performance * 4 + static * 1
    return max(0.0, 100.0 - deduction)


@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Aggregated analytics for the authenticated user",
)
async def get_stats(
    user_id: int = Depends(get_current_user_id),
    db:      Session = Depends(get_db),
) -> StatsResponse:
    """
    GET /api/stats

    Returns aggregated analytics derived from the user's full review history:
      - total_reviews, total_bugs, total_security_issues, total_performance_issues
      - avg_quality_score (0–100)
      - languages breakdown with counts + percentages
      - daily activity for the last 14 days
      - streak_days (consecutive days with ≥1 review ending today)
    """
    rows = (
        db.query(ReviewHistory)
        .filter(ReviewHistory.user_id == user_id)
        .order_by(ReviewHistory.created_at.desc())
        .all()
    )

    total_reviews      = len(rows)
    total_bugs         = 0
    total_security     = 0
    total_performance  = 0
    quality_scores: list[float] = []
    lang_counter       = Counter()
    day_counter: dict[str, int] = defaultdict(int)

    today = date.today()
    fourteen_days_ago = today - timedelta(days=13)

    for row in rows:
        # Language tally
        lang_counter[row.language or "unknown"] += 1

        # Parse result JSON
        try:
            data = json.loads(row.result_json or "{}")
        except (json.JSONDecodeError, TypeError):
            data = {}

        ai = data.get("ai_review", data)
        total_bugs        += len(ai.get("issues", []))
        total_security    += len(ai.get("security_issues", []))
        total_performance += len(ai.get("performance_issues", []))

        quality_scores.append(_score_from_result(row.result_json or "{}"))

        # Daily activity bucket (only last 14 days)
        if row.created_at:
            review_date = row.created_at.date() if hasattr(row.created_at, 'date') else row.created_at
            if review_date >= fourteen_days_ago:
                day_counter[review_date.isoformat()] += 1

    # Build 14-day activity series (fill zeros for missing days)
    activity: list[DailyActivity] = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        activity.append(DailyActivity(date=d.isoformat(), count=day_counter.get(d.isoformat(), 0)))

    # Streak: consecutive days ending today (or yesterday) with ≥1 review
    streak = 0
    for i in range(0, 365):
        check = today - timedelta(days=i)
        if day_counter.get(check.isoformat(), 0) > 0:
            streak += 1
        else:
            break

    # Language breakdown
    lang_stats: list[LanguageStat] = [
        LanguageStat(
            language=lang,
            count=cnt,
            percentage=round(cnt / total_reviews * 100, 1) if total_reviews else 0.0,
        )
        for lang, cnt in lang_counter.most_common()
    ]

    avg_score = round(sum(quality_scores) / len(quality_scores), 1) if quality_scores else 100.0

    logger.info(
        "Stats computed for user_id=%d: reviews=%d, bugs=%d, score=%.1f",
        user_id, total_reviews, total_bugs, avg_score,
    )

    return StatsResponse(
        total_reviews=total_reviews,
        total_bugs=total_bugs,
        total_security_issues=total_security,
        total_performance_issues=total_performance,
        avg_quality_score=avg_score,
        languages=lang_stats,
        activity=activity,
        streak_days=streak,
    )
