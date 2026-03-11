"""
OpenAI AI reviewer service.

Sends code to OpenAI's Chat Completions API and returns a structured
ReviewResponse containing issues, suggestions, improved code, and explanation.

Activated when AI_PROVIDER=openai in .env.
Falls back to mock when USE_MOCK=true or OPENAI_API_KEY is missing.
"""

import json
import re
import logging

from openai import OpenAI

from core.config import settings
from models.schemas import ReviewResponse
from services.mock_service import get_mock_review

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are an expert software engineer and code reviewer with deep knowledge "
    "of software design patterns, performance optimization, and best practices "
    "across multiple programming languages. "
    "You always respond with ONLY a valid JSON object — no markdown, no backticks, "
    "no explanatory text outside the JSON."
)

_USER_PROMPT_TEMPLATE = """Analyze the following {language} code and provide a thorough code review.

Return ONLY a JSON object with exactly these four keys:
- "issues": a JSON array of strings — each string describes one bug, error, code smell, or bad practice found (empty array if code is perfect)
- "suggestions": a JSON array of strings — each string is one actionable optimization or improvement suggestion (empty array if none)
- "improved_code": a single string — the fully rewritten, corrected, and optimized version of the code
- "explanation": a single string — a clear explanation of every change made and why it improves the code

Code to review ({language}):
```{language}
{code}
```

Respond with ONLY the JSON object. Example structure:
{{
  "issues": ["Issue 1 description", "Issue 2 description"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "improved_code": "// improved code here",
  "explanation": "The changes improve X because Y..."
}}"""


def _build_messages(language: str, code: str) -> list[dict]:
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "user",
            "content": _USER_PROMPT_TEMPLATE.format(
                language=language,
                code=code,
            ),
        },
    ]


def _parse_response(raw: str) -> ReviewResponse:
    """
    Extract and parse JSON from the OpenAI response.
    Strips markdown code fences if the model adds them despite instructions.
    """
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    data = json.loads(cleaned)

    return ReviewResponse(
        issues=data.get("issues", []),
        suggestions=data.get("suggestions", []),
        improved_code=data.get("improved_code", ""),
        explanation=data.get("explanation", ""),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def review_code_openai(language: str, code: str) -> ReviewResponse:
    """
    Send code to OpenAI Chat Completions for review.
    Returns a structured ReviewResponse.

    Falls back to mock if USE_MOCK=true or OPENAI_API_KEY is not set.
    """
    if settings.use_mock or not settings.openai_api_key:
        logger.info(
            "OpenAI service: using mock (use_mock=%s, api_key_set=%s)",
            settings.use_mock,
            bool(settings.openai_api_key),
        )
        return get_mock_review(language)

    try:
        client = OpenAI(api_key=settings.openai_api_key)

        messages = _build_messages(language, code)
        logger.info(
            "Sending review request to OpenAI [model=%s, language=%s, code_length=%d]",
            settings.openai_model,
            language,
            len(code),
        )

        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.2,          # Low temperature for consistent, factual output
            max_tokens=4096,
            response_format={"type": "json_object"},  # Force JSON mode
        )

        raw_text = response.choices[0].message.content or ""
        logger.debug("Raw OpenAI response: %s", raw_text[:500])

        return _parse_response(raw_text)

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse OpenAI JSON response: %s", exc)
        raise ValueError(
            "The AI returned an unexpected response format. Please try again."
        ) from exc

    except Exception as exc:
        logger.error("OpenAI API error: %s", exc)
        raise RuntimeError(f"AI service error: {exc}") from exc
