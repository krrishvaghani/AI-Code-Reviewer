"""
Gemini AI service — builds the prompt and calls the Gemini API.
When `USE_MOCK=true` in .env, the mock service is used instead.
Uses the current `google-genai` SDK (google.genai).
"""

import json
import re
import logging
import time as _time

from google import genai
from google.genai import types

from core.config import settings
from models.schemas import ReviewResponse, ComplexityAnalysis
from services.mock_service import get_mock_review

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """You are a senior software engineer, security auditor, and performance expert
with 15+ years of experience. Perform a comprehensive code review of the {language} code below.

Analyse across FOUR dimensions and respond with ONLY a valid JSON object — no markdown,
no backticks, no text outside the JSON.

The JSON must have exactly these seven keys:

1. "issues" — array of strings
   Bugs, logic errors, incorrect behaviour, off-by-one errors, null dereferences,
   resource leaks, and anti-patterns specific to the code shown.
   Format: "[SEVERITY: HIGH|MEDIUM|LOW] <location if inferable> — <description>"
   Empty array [] if none.

2. "performance_issues" — array of strings
   Algorithmic inefficiencies, N+1 patterns, blocking calls, redundant computation,
   missing caching, inefficient data structures, or poor Big-O choices.
   Format: "[PERF] <description and impact>"
   Empty array [] if none.

3. "security_issues" — array of strings
   Vulnerabilities such as: SQL/command/LDAP injection, hardcoded secrets,
   insecure eval/exec usage, path traversal, missing auth checks, exposed PII in logs,
   SSRF, unsafe deserialization, weak crypto (MD5, SHA-1, ECB mode).
   Format: "[OWASP CWE-<ID>] <description and remediation>"
   Empty array [] if none.

4. "suggestions" — array of strings
   Readability, naming, documentation, design patterns, idiomatic rewrites, test hints.
   Empty array [] if none.

5. "improved_code" — string
   Fully rewritten code that fixes ALL identified issues. Preserve original intent and API.

6. "explanation" — string
   Concise explanation of every change: what was changed, why, and which issue it resolves.

7. "complexity" — object:
   - "time_complexity"  : Big-O string (e.g. "O(n log n)")
   - "space_complexity" : Big-O string
   - "has_nested_loops" : boolean
   - "bottlenecks"      : array of strings
   - "optimization_hint": single sentence — the highest-impact optimisation

Code to review:
```{language}
{code}
```

Critical rules:
- Return ONLY the JSON object. No markdown. No backticks. No preamble.
- Findings must be specific to this code — do NOT invent generic issues.
- Empty array [] for any category with no findings."""


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

    complexity = None
    if c := data.get("complexity"):
        try:
            complexity = ComplexityAnalysis(
                time_complexity=c.get("time_complexity", "Unknown"),
                space_complexity=c.get("space_complexity", "Unknown"),
                has_nested_loops=bool(c.get("has_nested_loops", False)),
                bottlenecks=c.get("bottlenecks", []),
                optimization_hint=c.get("optimization_hint", ""),
            )
        except Exception:
            pass

    return ReviewResponse(
        issues=data.get("issues", []),
        performance_issues=data.get("performance_issues", []),
        security_issues=data.get("security_issues", []),
        suggestions=data.get("suggestions", []),
        improved_code=data.get("improved_code", ""),
        explanation=data.get("explanation", ""),
        complexity=complexity,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_RETRY_DELAY_S = 5   # seconds to wait before retrying on quota/rate errors


def review_code(language: str, code: str) -> ReviewResponse:
    """
    Send code to Gemini for review and return a structured ReviewResponse.
    Falls back to mock service if USE_MOCK=true or if the API key is missing.

    Error handling
    --------------
    Quota / rate-limit errors (HTTP 429)  → retry once after 5 s, then 503
    Network / transport errors            → 503
    JSON parse failure                    → 422
    Other API errors                      → 503
    """
    if settings.use_mock or not settings.gemini_api_key:
        logger.info("Using mock AI service (use_mock=%s, api_key_set=%s)",
                    settings.use_mock, bool(settings.gemini_api_key))
        return get_mock_review(language)

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = _build_prompt(language, code)
    logger.info(
        "Sending review request to Gemini [model=%s, language=%s, code_len=%d]",
        settings.gemini_model, language, len(code),
    )

    for attempt in range(2):  # one automatic retry on quota errors
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=4096,
                ),
            )

            raw_text = response.text
            logger.debug("Raw Gemini response (first 500 chars): %s", raw_text[:500])
            return _parse_response(raw_text)

        except json.JSONDecodeError as exc:
            logger.error("Failed to parse Gemini JSON response: %s", exc)
            raise ValueError(
                "The AI returned an unexpected response format. Please try again."
            ) from exc

        except Exception as exc:
            # Gemini SDK raises generic exceptions; inspect the message for quota signals
            err_str = str(exc).lower()
            is_quota = any(
                kw in err_str for kw in ("429", "quota", "rate", "resource_exhausted")
            )
            is_transient = any(
                kw in err_str for kw in ("503", "500", "unavailable", "connection", "timeout")
            )

            if is_quota and attempt == 0:
                logger.warning(
                    "Gemini quota/rate limit hit (attempt %d) — retrying in %ds…",
                    attempt + 1, _RETRY_DELAY_S,
                )
                _time.sleep(_RETRY_DELAY_S)
                continue

            if is_quota:
                logger.error("Gemini quota exceeded after retry: %s", exc)
                raise RuntimeError(
                    "AI service rate limit exceeded. Please wait a moment and try again."
                ) from exc

            if is_transient:
                logger.error("Gemini transient error: %s", exc)
                raise RuntimeError(
                    "AI service temporarily unavailable. Please try again later."
                ) from exc

            logger.error("Gemini API error: %s", exc)
            raise RuntimeError(f"AI service error: {exc}") from exc

