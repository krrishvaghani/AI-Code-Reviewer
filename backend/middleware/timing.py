"""
Request timing middleware.

Logs every HTTP request as:
    METHOD /path → status_code  [NNN.N ms]

Also injects an X-Response-Time response header so clients / load-balancers
can observe latency without consulting server logs.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("api.timing")


class TimingMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that records wall-clock latency for every request."""

    async def dispatch(self, request: Request, call_next) -> Response:
        t0 = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - t0) * 1_000

        logger.info(
            "%s %s → %d  [%.1f ms]",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        # Expose latency to the client (useful for frontend devtools / Postman)
        response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
        return response
