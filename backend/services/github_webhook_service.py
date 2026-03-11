"""
GitHub Webhook Service — automated Pull Request AI reviewer.

Flow:
  1. Receive PR payload from the webhook route.
  2. Fetch the list of changed files via GitHub API.
  3. For each reviewable file, obtain the diff patch and send it to the
     configured AI provider for a structured code review.
  4. Assemble a Markdown summary comment and post it on the PR.

Security:
  - All GitHub API calls use the Authorization: Bearer token.
  - follow_redirects=False on every httpx call to mitigate SSRF.
  - Auth header only added if GITHUB_TOKEN is configured.
"""

import logging
from typing import Optional

import httpx

from core.config import settings
from models.schemas import ReviewResponse
from services.ai_reviewer import review_code_openai
from services.gemini_service import review_code as review_code_gemini

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GITHUB_API = "https://api.github.com"

# Maximum files reviewed per PR to stay within token and time budgets
MAX_FILES_PER_PR = 6

# Maximum diff characters sent to the AI per file
MAX_PATCH_CHARS = 3_500

# File extensions the AI knows how to review
REVIEWABLE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".java", ".cpp", ".c", ".go", ".rs",
    ".rb", ".php", ".cs", ".kt", ".swift",
}

# Map file extension → language name understood by the AI prompt
_LANG_MAP: dict[str, str] = {
    ".py":   "python",
    ".js":   "javascript",
    ".jsx":  "javascript",
    ".ts":   "javascript",
    ".tsx":  "javascript",
    ".java": "java",
    ".cpp":  "cpp",
    ".c":    "cpp",
    ".go":   "python",     # closest general-purpose fallback
    ".rs":   "python",
    ".rb":   "python",
    ".php":  "javascript",
    ".cs":   "java",
    ".kt":   "java",
    ".swift":"java",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _detect_language(filename: str) -> str:
    """Return a language string the AI prompt understands from the file name."""
    if "." not in filename:
        return "python"
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    return _LANG_MAP.get(ext, "python")


def _github_headers() -> dict[str, str]:
    """Build GitHub API request headers, adding Bearer auth when available."""
    headers: dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AI-Code-Reviewer/1.0",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _dispatch_review(language: str, code: str) -> ReviewResponse:
    """Route to the correct AI provider based on AI_PROVIDER setting."""
    if settings.ai_provider.lower() == "openai":
        return review_code_openai(language=language, code=code)
    return review_code_gemini(language=language, code=code)


# ---------------------------------------------------------------------------
# GitHub API calls
# ---------------------------------------------------------------------------

def fetch_pr_files(owner: str, repo: str, pr_number: int) -> list[dict]:
    """
    Return the list of changed files for a Pull Request.

    GitHub endpoint: GET /repos/{owner}/{repo}/pulls/{pr_number}/files
    Each item has: filename, status, patch (diff), additions, deletions.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/files"
    resp = httpx.get(
        url,
        headers=_github_headers(),
        params={"per_page": 100},
        timeout=20,
        follow_redirects=False,
    )
    resp.raise_for_status()
    return resp.json()


def post_pr_comment(owner: str, repo: str, pr_number: int, body: str) -> None:
    """
    Post a comment on a Pull Request using the GitHub Issues Comments API.

    GitHub endpoint: POST /repos/{owner}/{repo}/issues/{pr_number}/comments
    Requires the token to have `repo` (or `public_repo`) scope.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/issues/{pr_number}/comments"
    resp = httpx.post(
        url,
        headers=_github_headers(),
        json={"body": body},
        timeout=20,
        follow_redirects=False,
    )
    resp.raise_for_status()
    logger.info("Comment posted on %s/%s#%d", owner, repo, pr_number)


# ---------------------------------------------------------------------------
# Comment formatter
# ---------------------------------------------------------------------------

def _format_pr_comment(
    file_results: list[dict],
    pr_title: str,
    repo_full_name: str,
    pr_number: int,
    skipped: int,
) -> str:
    """
    Build a Markdown PR comment from a list of per-file review results.

    Each item in file_results is:
      { "filename": str, "language": str, "review": ReviewResponse }
    """
    lines: list[str] = [
        "## 🤖 AI Code Review",
        "",
        f"> **PR #{pr_number}:** {pr_title}  ",
        f"> **Repository:** `{repo_full_name}`",
        "",
    ]

    if not file_results:
        lines.append("_No reviewable code changes were found in this PR._")
        lines.append("")
        lines.append("---")
        lines.append("_Generated by **AI Code Reviewer** 🤖_")
        return "\n".join(lines)

    for item in file_results:
        filename: str = item["filename"]
        language: str = item["language"]
        review: ReviewResponse = item["review"]

        lines.append("---")
        lines.append(f"### 📄 `{filename}`")
        lines.append("")

        # Issues
        if review.issues:
            lines.append("#### 🐛 Issues")
            for issue in review.issues:
                lines.append(f"- {issue}")
            lines.append("")
        else:
            lines.append("#### 🐛 Issues")
            lines.append("_No issues detected._")
            lines.append("")

        # Suggestions
        if review.suggestions:
            lines.append("#### ⚡ Suggestions")
            for s in review.suggestions:
                lines.append(f"- {s}")
            lines.append("")

        # Complexity
        if review.complexity:
            c = review.complexity
            lines.append("#### 🔬 Complexity")
            lines.append("")
            lines.append("| Metric | Value |")
            lines.append("|--------|-------|")
            lines.append(f"| Time   | `{c.time_complexity}` |")
            lines.append(f"| Space  | `{c.space_complexity}` |")
            nested_label = "⚠ Yes" if c.has_nested_loops else "✓ No"
            lines.append(f"| Nested loops | {nested_label} |")
            lines.append("")
            if c.bottlenecks:
                lines.append("**Bottlenecks:**")
                for b in c.bottlenecks:
                    lines.append(f"- {b}")
                lines.append("")
            if c.optimization_hint:
                lines.append(f"> 💡 **Optimization hint:** {c.optimization_hint}")
                lines.append("")

        # Improved code
        if review.improved_code and review.improved_code.strip():
            lines.append("#### ✨ Suggested Improvement")
            lines.append(f"```{language}")
            lines.append(review.improved_code.strip())
            lines.append("```")
            lines.append("")

        # Explanation
        if review.explanation and review.explanation.strip():
            lines.append("#### 💡 Explanation")
            lines.append(review.explanation.strip())
            lines.append("")

    # Footer
    lines.append("---")
    if skipped > 0:
        lines.append(
            f"_ℹ️ {skipped} file(s) were skipped "
            f"(binary, unsupported type, no diff, or PR limit of {MAX_FILES_PER_PR} files reached)._"
        )
        lines.append("")
    lines.append("_Generated by **AI Code Reviewer** 🤖_")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main orchestrator (called as a FastAPI BackgroundTask)
# ---------------------------------------------------------------------------

def process_pr_review(payload: dict) -> None:
    """
    Entry point called as a background task when a PR is opened or updated.

    Steps:
      1. Extract owner, repo, PR number from the GitHub webhook payload.
      2. Validate that a GitHub token is available for posting comments.
      3. Fetch the list of changed files.
      4. For each reviewable file: send the diff to the AI and collect results.
      5. Post the aggregated Markdown comment on the PR.
    """
    pr_data   = payload.get("pull_request", {})
    repo_data = payload.get("repository", {})

    repo_full_name: str = repo_data.get("full_name", "")
    pr_number: Optional[int] = pr_data.get("number")
    pr_title:  str = pr_data.get("title", "Untitled PR")

    if not repo_full_name or "/" not in repo_full_name:
        logger.error("process_pr_review: invalid repo full_name '%s'", repo_full_name)
        return

    if not pr_number:
        logger.error("process_pr_review: missing pull_request.number in payload")
        return

    owner, repo = repo_full_name.split("/", 1)
    logger.info("Starting AI review for %s#%d (%s)", repo_full_name, pr_number, pr_title)

    # Require a GitHub token — without it we cannot post comments
    if not settings.github_token:
        logger.error(
            "GITHUB_TOKEN is not set. Cannot post comment on %s#%d. "
            "Add GITHUB_TOKEN to your .env file.",
            repo_full_name,
            pr_number,
        )
        return

    # ---- 1. Fetch changed files ----
    try:
        files = fetch_pr_files(owner, repo, pr_number)
    except httpx.HTTPStatusError as exc:
        logger.error(
            "GitHub API error fetching files for %s#%d: %s",
            repo_full_name, pr_number, exc.response.text,
        )
        return
    except Exception as exc:
        logger.error("Failed to fetch PR files for %s#%d: %s", repo_full_name, pr_number, exc)
        return

    # ---- 2. Review each changed file ----
    file_results: list[dict] = []
    skipped = 0

    for file_info in files:
        filename: str = file_info.get("filename", "")
        status:   str = file_info.get("status", "")
        patch:    str = file_info.get("patch", "")

        # Skip deleted files — nothing to review
        if status == "removed":
            skipped += 1
            continue

        # Skip files without a diff patch (binary files, etc.)
        if not patch or not patch.strip():
            skipped += 1
            continue

        # Skip non-code file types
        ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
        if ext not in REVIEWABLE_EXTENSIONS:
            skipped += 1
            continue

        # Honour the per-PR file cap
        if len(file_results) >= MAX_FILES_PER_PR:
            skipped += 1
            continue

        language = _detect_language(filename)
        # Trim the diff to the token budget
        code_to_review = patch[:MAX_PATCH_CHARS]

        logger.info("Reviewing %s (%s, %d chars)", filename, language, len(code_to_review))
        try:
            review = _dispatch_review(language, code_to_review)
            file_results.append({
                "filename": filename,
                "language": language,
                "review":   review,
            })
        except Exception as exc:
            logger.error("AI review failed for %s: %s", filename, exc)
            skipped += 1

    # ---- 3. Nothing reviewable → stay silent ----
    if not file_results:
        logger.info(
            "No reviewable files found in %s#%d — skipping comment.",
            repo_full_name, pr_number,
        )
        return

    # ---- 4. Build and post the comment ----
    comment_body = _format_pr_comment(
        file_results=file_results,
        pr_title=pr_title,
        repo_full_name=repo_full_name,
        pr_number=pr_number,
        skipped=skipped,
    )

    try:
        post_pr_comment(owner, repo, pr_number, comment_body)
        logger.info(
            "AI review comment posted successfully on %s#%d (%d file(s) reviewed, %d skipped).",
            repo_full_name, pr_number, len(file_results), skipped,
        )
    except httpx.HTTPStatusError as exc:
        logger.error(
            "GitHub API error posting comment on %s#%d: %s",
            repo_full_name, pr_number, exc.response.text,
        )
    except Exception as exc:
        logger.error("Failed to post comment on %s#%d: %s", repo_full_name, pr_number, exc)
