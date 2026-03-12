"""
Global exception handlers — every error is returned as a structured JSON envelope:

    { "status": "error", "message": "<human-readable description>" }

Registered in main.py via app.add_exception_handler().

Handled exception types
------------------------
StarletteHTTPException   → HTTP 4xx / 5xx raised by FastAPI / routes
RequestValidationError   → Pydantic request-body or query-param validation failure
Exception (catch-all)    → Any unhandled Python exception → 500
"""

import logging

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _error_response(status_code: int, message: str) -> JSONResponse:
    """Build the standard error envelope."""
    return JSONResponse(
        status_code=status_code,
        content={"status": "error", "message": message},
    )


# ---------------------------------------------------------------------------
# Exception handlers (registered in main.py)
# ---------------------------------------------------------------------------

async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """Re-shape HTTPException into the standard error envelope."""
    return _error_response(exc.status_code, str(exc.detail))


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """
    Flatten Pydantic field errors into a single readable sentence.

    Example input errors:
        [{"loc": ["body", "code"], "msg": "code must not be empty", ...}]
    Example output:
        {"status": "error", "message": "code: code must not be empty"}
    """
    parts: list[str] = []
    for err in exc.errors():
        # Drop generic container names ("body", "query") from the location chain
        loc_parts = [str(l) for l in err["loc"] if l not in ("body", "query")]
        loc = " → ".join(loc_parts)
        parts.append(f"{loc}: {err['msg']}" if loc else err["msg"])
    message = "; ".join(parts) if parts else "Invalid request data."
    return _error_response(status.HTTP_422_UNPROCESSABLE_ENTITY, message)


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Catch-all handler — logs full traceback and returns a safe 500 message."""
    logger.exception(
        "Unhandled exception on %s %s", request.method, request.url.path
    )
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "An unexpected error occurred. Please try again later.",
    )
