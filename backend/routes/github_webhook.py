"""
GitHub Webhook route — POST /github-webhook

Receives GitHub webhook events, verifies the HMAC-SHA256 signature,
and dispatches Pull Request events to the AI review background task.

Security:
  - Reads the raw request body *before* JSON parsing so the signature
    is verified against the exact bytes GitHub sent (required for HMAC).
  - Uses hmac.compare_digest() for constant-time comparison (timing-safe).
  - Returns HTTP 403 for any invalid or missing signature when
    GITHUB_WEBHOOK_SECRET is configured.
  - Responds HTTP 202 immediately and runs the AI review asynchronously
    (GitHub requires a response within 10 seconds).
"""

import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request, status

from core.config import settings
from services.github_webhook_service import process_pr_review

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhooks"])


# ---------------------------------------------------------------------------
# Signature verification
# ---------------------------------------------------------------------------

def _verify_signature(body: bytes, signature_header: str) -> None:
    """
    Verify the X-Hub-Signature-256 header sent by GitHub.

    If GITHUB_WEBHOOK_SECRET is not set, verification is skipped with a warning
    (acceptable in local development, must be set in production).

    Raises:
        HTTPException(403) — if the secret is set and the signature is wrong/missing.
    """
    if not settings.github_webhook_secret:
        logger.warning(
            "GITHUB_WEBHOOK_SECRET is not configured — "
            "webhook signature verification is DISABLED. "
            "Set GITHUB_WEBHOOK_SECRET in .env for production use."
        )
        return

    if not signature_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="X-Hub-Signature-256 header is missing.",
        )

    if not signature_header.startswith("sha256="):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="X-Hub-Signature-256 format is invalid (expected 'sha256=<hex>').",
        )

    # Compute expected signature
    mac = hmac.new(
        settings.github_webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    )
    expected_hex = mac.hexdigest()
    received_hex = signature_header[len("sha256="):]

    # Constant-time comparison prevents timing attacks
    if not hmac.compare_digest(expected_hex, received_hex):
        logger.warning("Webhook signature mismatch — request rejected.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook signature verification failed.",
        )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/github-webhook",
    summary="GitHub Pull Request webhook receiver",
    description=(
        "Listens for GitHub webhook events. When a Pull Request is opened or "
        "updated (`synchronize`), triggers an automated AI code review in the "
        "background and posts the results as a comment on the PR."
    ),
    status_code=status.HTTP_202_ACCEPTED,
)
async def github_webhook(
    request:        Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str = Header(default="", alias="X-Hub-Signature-256"),
    x_github_event:      str = Header(default="", alias="X-GitHub-Event"),
) -> dict:
    """
    POST /github-webhook

    GitHub sends this request whenever a configured event occurs on the
    repository. We only act on `pull_request` events with action
    `opened` or `synchronize`.

    Headers (set by GitHub automatically):
        X-GitHub-Event       — event type (e.g. "pull_request", "push")
        X-Hub-Signature-256  — HMAC-SHA256 of the raw body using the webhook secret

    Returns:
        202 Accepted — when the review has been queued.
        200 OK       — when the event is intentionally ignored.
        403 Forbidden — when the signature is invalid.
        400 Bad Request — when the payload is not valid JSON.
    """
    # Read raw bytes — must happen before any body parsing
    body: bytes = await request.body()

    # ── Security: verify GitHub's HMAC signature ─────────────────────────────
    _verify_signature(body, x_hub_signature_256)

    # ── Filter: only handle pull_request events ───────────────────────────────
    if x_github_event != "pull_request":
        logger.debug("Ignored webhook event: %s", x_github_event)
        return {
            "status":  "ignored",
            "reason":  f"Unsupported event type: '{x_github_event}'. Only 'pull_request' is handled.",
        }

    # ── Parse JSON payload ────────────────────────────────────────────────────
    try:
        payload: dict = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON payload: {exc}",
        ) from exc

    # ── Filter: only act on opened / synchronize (new commits pushed) ─────────
    action: str     = payload.get("action", "")
    pr_number: int  = payload.get("pull_request", {}).get("number", 0)
    repo_name: str  = payload.get("repository",   {}).get("full_name", "unknown")

    if action not in ("opened", "synchronize"):
        logger.debug("Ignored PR action '%s' on %s#%d.", action, repo_name, pr_number)
        return {
            "status": "ignored",
            "reason": f"PR action '{action}' is not reviewed. Only 'opened' and 'synchronize' trigger a review.",
        }

    # ── Queue the AI review as a background task ──────────────────────────────
    logger.info(
        "PR %s event received for %s#%d — queuing AI review.",
        action, repo_name, pr_number,
    )
    background_tasks.add_task(process_pr_review, payload)

    return {
        "status":  "accepted",
        "message": f"AI review queued for {repo_name}#{pr_number}.",
    }
