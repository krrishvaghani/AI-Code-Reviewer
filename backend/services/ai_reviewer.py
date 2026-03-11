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
from models.schemas import ReviewResponse, ComplexityAnalysis
from services.mock_service import get_mock_review

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are a senior software engineer, security auditor, and performance expert "
    "with 15+ years of experience across Python, JavaScript, Java, C++, and more. "
    "You perform deep code reviews covering correctness, security (OWASP Top 10), "
    "performance, and code quality. "
    "You always respond with ONLY a valid JSON object — no markdown fences, no backticks, "
    "no prose outside the JSON structure."
)

_USER_PROMPT_TEMPLATE = """Perform a comprehensive code review of the {language} code below.

You must analyse the code across FOUR distinct dimensions and return ONLY a JSON object
with exactly these seven keys:

1. "issues" — array of strings
   Bugs, logic errors, incorrect behaviour, off-by-one errors, null/undefined dereferences,
   resource leaks, anti-patterns, and code-style violations.
   Each item: "[SEVERITY: HIGH|MEDIUM|LOW] <file location if inferable> — <concise description>"
   Empty array if none found.

2. "performance_issues" — array of strings
   Algorithmic inefficiencies, unnecessary re-computation, N+1 query patterns, blocking I/O,
   missing caching, inefficient data structures, memory churn, or suboptimal Big-O usage.
   Each item: "[PERF] <concise description and impact>"
   Empty array if none found.

3. "security_issues" — array of strings
   Security vulnerabilities including (but not limited to):
   - Injection risks (SQL, command, LDAP, XSS)
   - Hardcoded secrets, API keys, or passwords
   - Insecure deserialization or eval usage
   - Path traversal or directory listing
   - Broken authentication / missing authorisation checks
   - Exposed sensitive data or PII in logs
   - SSRF or unvalidated redirects
   - Insecure cryptographic choices (MD5, SHA-1, ECB mode)
   Each item: "[OWASP CWE-<ID>] <concise description and remediation>"
   Empty array if none found.

4. "suggestions" — array of strings
   Readability, maintainability, naming conventions, documentation, design pattern
   improvements, test coverage hints, and language-idiomatic rewrites.
   Empty array if none found.

5. "improved_code" — string
   A fully rewritten, corrected, and optimised version of the code that addresses
   ALL issues found above. Preserve the original intent and public API.

6. "explanation" — string
   A concise but complete explanation of every change made: what was changed,
   which issue it addresses, and why it improves the code.

7. "complexity" — object with exactly:
   - "time_complexity"  : Big-O notation string (e.g. "O(n log n)")
   - "space_complexity" : Big-O notation string
   - "has_nested_loops" : boolean
   - "bottlenecks"      : array of strings describing specific inefficiencies
   - "optimization_hint": one sentence — the single highest-impact optimisation

Code to review ({language}):
```{language}
{code}
```

Rules:
- Respond with ONLY the JSON object — absolutely no markdown, no backticks, no preamble.
- Every finding must be specific to the actual code provided — do NOT invent generic issues.
- If a category has no findings, set it to an empty array [].
- Keep each finding to one clear, self-contained sentence.

Example structure (values are illustrative only):
{{
  "issues": ["[SEVERITY: HIGH] Line 12 — NullPointerException if `user` is None before attribute access"],
  "performance_issues": ["[PERF] Quadratic O(n²) comparison inside nested loop — use a hash set for O(n)"],
  "security_issues": ["[OWASP CWE-89] User input concatenated directly into SQL query — use parameterised statements"],
  "suggestions": ["Add type hints to all public functions for IDE support and static analysis"],
  "improved_code": "# fixed code here",
  "explanation": "Replaced raw SQL with parameterised query to prevent injection. Added None guard.",
  "complexity": {{
    "time_complexity": "O(n)",
    "space_complexity": "O(1)",
    "has_nested_loops": false,
    "bottlenecks": ["Linear scan without early exit on match"],
    "optimization_hint": "Use a hash set for O(1) membership tests instead of O(n) list scans."
  }}
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
