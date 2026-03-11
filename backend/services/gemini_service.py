"""
Gemini AI service — builds the prompt and calls the Gemini API.
When `USE_MOCK=true` in .env, the mock service is used instead.
Uses the current `google-genai` SDK (google.genai).
"""

import json
import re
import logging

from google import genai
from google.genai import types

from core.config import settings
from models.schemas import ReviewResponse
from services.mock_service import get_mock_review

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """You are an expert software engineer and code reviewer.
Analyze the following {language} code and respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

The JSON must have exactly these four keys:
- "issues": a JSON array of strings describing bugs, errors, or code smells found (empty array if none)
- "suggestions": a JSON array of strings with improvement suggestions (empty array if none)
- "improved_code": a single string containing the fully rewritten, improved version of the code
- "explanation": a single string explaining what was changed and why

Code to review:
```{language}
{code}
```

Respond with ONLY the JSON object."""


def _build_prompt(language: str, code: str) -> str:
    return _PROMPT_TEMPLATE.format(language=language, code=code)


def _parse_response(raw: str) -> ReviewResponse:
    """
    Extract and parse the JSON object from the LLM response.
    The model sometimes wraps the JSON in markdown code fences — strip those.
    """
    # Remove markdown code fences like ```json ... ``` or ``` ... ```
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

def review_code(language: str, code: str) -> ReviewResponse:
    """
    Send code to Gemini for review and return a structured ReviewResponse.
    Falls back to mock service if USE_MOCK=true or if the API key is missing.
    """
    if settings.use_mock or not settings.gemini_api_key:
        logger.info("Using mock AI service (use_mock=%s, api_key_set=%s)",
                    settings.use_mock, bool(settings.gemini_api_key))
        return get_mock_review(language)

    try:
        client = genai.Client(api_key=settings.gemini_api_key)

        prompt = _build_prompt(language, code)
        logger.info("Sending review request to Gemini [language=%s, code_length=%d]",
                    language, len(code))

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=4096,
            ),
        )

        raw_text = response.text
        logger.debug("Raw Gemini response: %s", raw_text[:500])

        return _parse_response(raw_text)

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini JSON response: %s", exc)
        raise ValueError(
            "The AI returned an unexpected response format. Please try again."
        ) from exc
    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        raise RuntimeError(f"AI service error: {exc}") from exc
