from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional, Any
from enum import Enum


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
        return stripped


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
    issues: List[str]
    suggestions: List[str]
    improved_code: str
    explanation: str
    complexity: Optional[ComplexityAnalysis] = None


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
    top_issues: List[str]
    top_suggestions: List[str]
    file_reviews: List[FileReview]
