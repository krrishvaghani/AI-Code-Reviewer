from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional, Any
from enum import Enum


# ---------------------------------------------------------------------------
# Standard error envelope
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    """
    Structured error response returned by all error handlers.
    Shape: {"status": "error", "message": "<human-readable reason>"}
    """
    status: str = "error"
    message: str


class Language(str, Enum):
    python = "python"
    javascript = "javascript"
    java = "java"
    cpp = "cpp"


class ReviewRequest(BaseModel):
    language: Language
    code: str

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("code must not be empty")
        if len(stripped) > 20_000:
            raise ValueError("code must not exceed 20,000 characters")
        # Reject obviously binary / non-text payloads
        non_printable = sum(1 for c in stripped[:500] if not c.isprintable() and c not in "\n\r\t")
        if non_printable > 20:
            raise ValueError("code contains too many non-printable characters — only source code is accepted")
        return stripped


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Static analysis
# ---------------------------------------------------------------------------

class StaticAnalysisFinding(BaseModel):
    line:     Optional[int] = None
    column:   Optional[int] = None
    severity: str                        # "error" | "warning" | "info"
    code:     str                        # e.g. "C0301", "no-unused-vars"
    message:  str
    tool:     str                        # "pylint" | "eslint"


# ---------------------------------------------------------------------------
# Complexity analysis
# ---------------------------------------------------------------------------

class ComplexityAnalysis(BaseModel):
    time_complexity: str          # e.g. "O(n²)"
    space_complexity: str         # e.g. "O(1)"
    has_nested_loops: bool
    bottlenecks: List[str]        # detected bottlenecks
    optimization_hint: str        # one-liner tip


class ReviewResponse(BaseModel):
    issues: List[str]                              # bugs, errors, code smells
    performance_issues: List[str] = []            # algorithmic / runtime performance problems
    security_issues: List[str]    = []            # security vulnerabilities (OWASP-class)
    suggestions: List[str]                        # general style / quality improvements
    improved_code: str
    explanation: str
    complexity: Optional[ComplexityAnalysis] = None


class FullReviewResponse(BaseModel):
    """Top-level response returned by POST /api/review."""
    static_analysis: List[StaticAnalysisFinding] = []  # linter findings (pylint / eslint)
    ai_review: ReviewResponse                          # full AI analysis


# ---------------------------------------------------------------------------
# Chat with Code
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    code: str
    question: str
    language: str = "python"

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("question must not be empty")
        if len(stripped) > 2_000:
            raise ValueError("question must not exceed 2,000 characters")
        return stripped

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("code must not be empty")
        if len(stripped) > 20_000:
            raise ValueError("code must not exceed 20,000 characters")
        return stripped


class ChatResponse(BaseModel):
    answer: str


# ---------------------------------------------------------------------------
# GitHub Repository Review
# ---------------------------------------------------------------------------

class GithubReviewRequest(BaseModel):
    repo_url: str

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        from urllib.parse import urlparse
        parsed = urlparse(v.strip())
        if parsed.hostname not in ("github.com", "www.github.com"):
            raise ValueError("URL must be a github.com repository URL")
        parts = [p for p in parsed.path.strip("/").split("/") if p]
        if len(parts) < 2:
            raise ValueError("URL must point to a repository (github.com/owner/repo)")
        return v.strip()


class FileReview(BaseModel):
    path: str
    language: str
    issues: List[str]
    suggestions: List[str]


class GithubReviewResponse(BaseModel):
    repo_name: str
    files_analyzed: int
    structure_summary: str
    overall_quality: str


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Review History
# ---------------------------------------------------------------------------

class HistoryItemOut(BaseModel):
    id: int
    language: str
    code_snippet: Optional[str] = None
    review_type: str
    title: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SaveHistoryRequest(BaseModel):
    language: str
    code: str
    result: Any
    review_type: str = "code"
    title: str = "Code Review"


# ---------------------------------------------------------------------------
# Dashboard Analytics
# ---------------------------------------------------------------------------

class LanguageStat(BaseModel):
    language: str
    count: int
    percentage: float   # 0–100


class DailyActivity(BaseModel):
    date: str    # ISO date "YYYY-MM-DD"
    count: int


class StatsResponse(BaseModel):
    """Aggregated analytics computed from the user's review history."""
    total_reviews: int
    total_bugs: int                  # sum of ai_review.issues across all reviews
    total_security_issues: int       # sum of ai_review.security_issues
    total_performance_issues: int    # sum of ai_review.performance_issues
    avg_quality_score: float         # 0–100 (100 = no issues found)
    languages: List[LanguageStat]    # language breakdown
    activity: List[DailyActivity]    # reviews per day — last 14 days
    streak_days: int                 # consecutive days with ≥1 review (up to today)

    top_issues: List[str]
    top_suggestions: List[str]
    file_reviews: List[FileReview]
