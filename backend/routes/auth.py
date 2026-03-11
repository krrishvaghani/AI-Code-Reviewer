"""
Authentication routes — signup, login, and current-user info.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User
from models.schemas import SignupRequest, LoginRequest, TokenResponse, UserOut
from auth.jwt_handler import hash_password, verify_password, create_access_token, get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# POST /auth/signup
# ---------------------------------------------------------------------------

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account",
)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account.
    Returns a JWT token on success so the client can immediately be logged in.
    """
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    logger.info("New user signed up: %s (id=%d)", user.email, user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user.id, name=user.name, email=user.email),
    )


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive a JWT",
)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.
    Returns a signed JWT valid for 7 days.
    """
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_access_token({"sub": str(user.id)})
    logger.info("User logged in: %s (id=%d)", user.email, user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user.id, name=user.name, email=user.email),
    )


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the current authenticated user",
)
def get_me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Return profile info for the token's owner."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return UserOut(id=user.id, name=user.name, email=user.email)
