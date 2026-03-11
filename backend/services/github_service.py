"""
GitHub Repository Review service.

Fetches source files from a public GitHub repository and asks the AI to
analyse the overall structure, quality, and per-file issues.

Security: validates that the URL is github.com before making any HTTP request
(SSRF protection). Never follows redirects to private hosts.
"""

import base64
import json
import logging
import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from openai import OpenAI
from google import genai
from google.genai import types

from core.config import settings
from models.schemas import GithubReviewResponse, FileReview

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"

# File extensions we will review
REVIEWABLE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c",
    ".go", ".rs", ".rb", ".php", ".cs", ".kt", ".swift",
}

MAX_FILES = 5
MAX_FILE_CHARS = 1_500   # chars per file — keeps prompt within token budget

# ---------------------------------------------------------------------------
# SSRF-safe URL parsing
# ---------------------------------------------------------------------------

def _parse_github_url(url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a github.com URL. Raises ValueError if invalid."""
    parsed = urlparse(url)
    # Only allow github.com — no redirects to internal hosts
    if parsed.hostname not in ("github.com", "www.github.com"):
        raise ValueError("Only github.com URLs are supported.")
    parts = [p for p in parsed.path.strip("/").split("/") if p]
    if len(parts) < 2:
        raise ValueError("URL must point to a repository (github.com/owner/repo).")
    return parts[0], parts[1]


# ---------------------------------------------------------------------------
# GitHub API helpers
# ---------------------------------------------------------------------------

def _detect_language(path: str) -> str:
    ext = ("." + path.rsplit(".", 1)[-1].lower()) if "." in path else ""
    return {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".jsx": "javascript", ".tsx": "typescript", ".java": "java",
        ".cpp": "cpp", ".c": "c", ".go": "go", ".rs": "rust",
        ".rb": "ruby", ".php": "php", ".cs": "csharp", ".kt": "kotlin",
        ".swift": "swift",
    }.get(ext, "text")


def _github_headers() -> dict:
    return {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AI-Code-Reviewer/1.0",
    }


def _fetch_tree(owner: str, repo: str) -> list[dict]:
    url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
    resp = httpx.get(url, headers=_github_headers(), timeout=12, follow_redirects=False)
    resp.raise_for_status()
    return resp.json().get("tree", [])


def _fetch_file_content(owner: str, repo: str, path: str) -> Optional[str]:
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    resp = httpx.get(url, headers=_github_headers(), timeout=10, follow_redirects=False)
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("encoding") != "base64":
        return None
    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return content[:MAX_FILE_CHARS]


# ---------------------------------------------------------------------------
# AI prompts
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are a senior software engineer performing a repository-level code review. "
    "Analyze the provided files and respond ONLY with a valid JSON object — "
    "no markdown, no backticks, no extra text outside the JSON."
)


def _build_repo_prompt(repo_name: str, files: list[dict]) -> str:
    file_block = ""
    for f in files:
        file_block += f"\n\n--- File: {f['path']} ({f['language']}) ---\n{f['content']}"

    return f"""Review this GitHub repository: {repo_name}

Files provided:{file_block}

Return ONLY a JSON object with these keys:
- "structure_summary": string — 2-3 sentence overview of what this repo does and its architecture
- "overall_quality": string — one of: "Excellent" | "Good" | "Needs Improvement" | "Poor"
- "top_issues": array of up to 5 strings — cross-cutting issues across files
- "top_suggestions": array of up to 5 strings — high-impact improvements
- "file_reviews": array of objects, one per file analyzed, each with:
  - "path": string
  - "language": string
  - "issues": array of up to 3 strings
  - "suggestions": array of up to 3 strings

Keep each string concise (max 120 characters). Respond with ONLY the JSON."""


# ---------------------------------------------------------------------------
# Mock response
# ---------------------------------------------------------------------------

_MOCK_RESPONSE = GithubReviewResponse(
    repo_name="example/repo",
    files_analyzed=2,
    structure_summary=(
        "This is a sample repository with Python and JavaScript files demonstrating "
        "basic algorithms and utility functions. The project lacks a test suite and "
        "documentation."
    ),
    overall_quality="Needs Improvement",
    top_issues=[
        "No unit tests found in any analyzed files.",
        "Missing type annotations across Python modules.",
        "JavaScript files use var instead of const/let.",
        "No README or documentation found.",
    ],
    top_suggestions=[
        "Add a test suite (pytest for Python, Jest for JavaScript).",
        "Add type hints to all Python functions.",
        "Replace var with const/let in JavaScript files.",
        "Add a README.md with setup instructions.",
    ],
    file_reviews=[
        FileReview(
            path="main.py",
            language="python",
            issues=["No null checks on function parameters.", "Uses bare except clauses."],
            suggestions=["Add type hints.", "Use specific exception types."],
        ),
        FileReview(
            path="utils.js",
            language="javascript",
            issues=["Uses var declarations.", "No JSDoc comments."],
            suggestions=["Use const/let.", "Add JSDoc for exported functions."],
        ),
    ],
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def review_github_repo(repo_url: str) -> GithubReviewResponse:
    """
    Fetch and analyse a public GitHub repository.
    Returns a structured GithubReviewResponse.
    """
    if settings.use_mock:
        mock = _MOCK_RESPONSE.model_copy(deep=True)
        try:
            owner_repo = repo_url.rstrip("/").split("github.com/")[-1].split("?")[0]
            mock.repo_name = owner_repo
        except Exception:
            pass
        return mock

    try:
        owner, repo = _parse_github_url(repo_url)
        repo_name = f"{owner}/{repo}"

        tree = _fetch_tree(owner, repo)

        # Select reviewable files; prefer top-level and src/ files
        candidates = [
            leaf for leaf in tree
            if leaf["type"] == "blob"
            and any(leaf["path"].endswith(ext) for ext in REVIEWABLE_EXTENSIONS)
            and leaf.get("size", 0) < 100_000
        ]
        candidates.sort(key=lambda f: (f["path"].count("/"), f["path"]))
        selected = candidates[:MAX_FILES]

        files = []
        for leaf in selected:
            content = _fetch_file_content(owner, repo, leaf["path"])
            if content:
                files.append({
                    "path": leaf["path"],
                    "language": _detect_language(leaf["path"]),
                    "content": content,
                })

        if not files:
            raise ValueError("No reviewable source files found in this repository.")

        raw = _call_ai(repo_name, files)
        data = json.loads(raw)

        return GithubReviewResponse(
            repo_name=repo_name,
            files_analyzed=len(files),
            structure_summary=data.get("structure_summary", ""),
            overall_quality=data.get("overall_quality", "Unknown"),
            top_issues=data.get("top_issues", []),
            top_suggestions=data.get("top_suggestions", []),
            file_reviews=[
                FileReview(
                    path=fr["path"],
                    language=fr.get("language", ""),
                    issues=fr.get("issues", []),
                    suggestions=fr.get("suggestions", []),
                )
                for fr in data.get("file_reviews", [])
            ],
        )

    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise ValueError(
                "Repository not found. Make sure the URL is correct and the repo is public."
            ) from exc
        raise RuntimeError(f"GitHub API error: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError("AI returned an unexpected response format. Please try again.") from exc
    except (ValueError, RuntimeError):
        raise
    except Exception as exc:
        logger.exception("Unexpected error during GitHub review")
        raise RuntimeError(f"GitHub review failed: {exc}") from exc


def _call_ai(repo_name: str, files: list[dict]) -> str:
    """Call the configured AI provider and return the raw JSON string."""
    prompt = _build_repo_prompt(repo_name, files)
    provider = settings.ai_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        return resp.choices[0].message.content or ""

    elif settings.gemini_api_key:
        gc = genai.Client(api_key=settings.gemini_api_key)
        response = gc.models.generate_content(
            model=settings.gemini_model,
            contents=_SYSTEM_PROMPT + "\n\n" + prompt,
            config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=4096),
        )
        raw = response.text or ""
        return re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()

    else:
        raise RuntimeError("No AI provider is configured. Set OPENAI_API_KEY or GEMINI_API_KEY.")
