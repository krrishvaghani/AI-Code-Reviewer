"""
Review history routes — store and retrieve past code reviews per user.
"""

import json
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import ReviewHistory
from models.schemas import HistoryItemOut, SaveHistoryRequest
from auth.jwt_handler import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["history"])


@router.get(
    "/history",
    response_model=List[HistoryItemOut],
    summary="List the authenticated user's review history",
)
def get_history(
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
def save_history(
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
def delete_history(
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
