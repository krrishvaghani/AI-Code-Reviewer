"""
JWT authentication utilities + FastAPI dependency functions.

Provides:
  - hash_password / verify_password  (bcrypt via passlib)
  - create_access_token / decode_token  (HS256 JWT via python-jose)
  - get_current_user_id   — strict: raises 401 if missing/invalid
  - get_optional_user_id  — soft: returns None instead of raising
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return _pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

_ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_minutes: int = 60 * 24 * 7) -> str:
    """Create a signed JWT that expires in `expires_minutes` (default: 7 days)."""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT. Returns None on any error."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> int:
    """
    Strict auth dependency — raises HTTP 401 if the request carries no valid
    Bearer token. Use on endpoints that absolutely require a logged-in user.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return int(payload["sub"])


def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[int]:
    """
    Soft auth dependency — returns None instead of raising when the token is
    absent or invalid. Use for endpoints that work both anonymously and
    authenticated (e.g., save history only when logged in).
    """
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        return None
    return int(payload["sub"])
