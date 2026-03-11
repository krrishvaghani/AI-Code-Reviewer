"""
SQLAlchemy ORM models — User and ReviewHistory tables.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String(100), nullable=False)
    email          = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    language     = Column(String(50), default="python")
    # Truncated code preview (first 300 chars) for history listing
    code_snippet = Column(Text)
    # Full serialised response JSON for detail view
    result_json  = Column(Text)
    # "code" | "github" | "chat"
    review_type  = Column(String(50), default="code")
    # Filename, repo name, or first line of code
    title        = Column(String(255), default="Code Review")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
