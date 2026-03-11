from pydantic import BaseModel, field_validator
from typing import List
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


class ReviewResponse(BaseModel):
    issues: List[str]
    suggestions: List[str]
    improved_code: str
    explanation: str
