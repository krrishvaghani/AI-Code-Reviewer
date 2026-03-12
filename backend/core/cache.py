"""
In-memory TTL cache for AI code reviews.

Design
------
* Keyed by SHA-256( language + "\\0" + code ) — collision-free identity for any input.
* Each entry expires after `ttl_seconds` (default 5 min).
* Bounded at `max_size` entries; when full the soonest-to-expire entry is evicted first.
* An asyncio.Lock guards all mutations so it is safe to use from concurrent requests.
* A module-level singleton `review_cache` is the only instance used by the application.

Usage
-----
    from core.cache import review_cache

    cached = await review_cache.get(language, code)
    if cached is None:
        result = await run_review(...)
        await review_cache.set(language, code, result)
"""

import asyncio
import hashlib
import logging
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


class _TTLCache:
    """Async-safe, size-bounded, TTL dictionary."""

    def __init__(self, ttl_seconds: int = 300, max_size: int = 200) -> None:
        # Stored as  key -> (value, expires_monotonic)
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = asyncio.Lock()
        self._ttl = ttl_seconds
        self._max = max_size

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _make_key(language: str, code: str) -> str:
        payload = f"{language}\x00{code}".encode()
        return hashlib.sha256(payload).hexdigest()

    def _is_expired(self, key: str) -> bool:
        _, expires_at = self._store[key]
        return time.monotonic() > expires_at

    def _evict_oldest(self) -> None:
        """Remove the entry that expires soonest (already holds the lock)."""
        oldest_key = min(self._store, key=lambda k: self._store[k][1])
        del self._store[oldest_key]
        logger.debug("Cache evicted key=%s… (capacity=%d)", oldest_key[:12], self._max)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get(self, language: str, code: str) -> Optional[Any]:
        """Return the cached value, or None if missing / expired."""
        key = self._make_key(language, code)
        async with self._lock:
            if key not in self._store:
                return None
            if self._is_expired(key):
                del self._store[key]
                return None
            return self._store[key][0]

    async def set(self, language: str, code: str, value: Any) -> None:
        """Insert / update an entry. Evicts the oldest entry if at capacity."""
        key = self._make_key(language, code)
        async with self._lock:
            if len(self._store) >= self._max and key not in self._store:
                self._evict_oldest()
            self._store[key] = (value, time.monotonic() + self._ttl)
            logger.debug(
                "Cache stored key=%s… (size=%d, ttl=%ds)",
                key[:12], len(self._store), self._ttl,
            )

    async def invalidate(self, language: str, code: str) -> bool:
        """Remove a specific entry. Returns True if it existed."""
        key = self._make_key(language, code)
        async with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    async def clear(self) -> None:
        """Flush all entries."""
        async with self._lock:
            self._store.clear()
        logger.info("Review cache cleared.")

    @property
    def size(self) -> int:
        """Current number of entries (includes possibly-expired ones)."""
        return len(self._store)

    def stats(self) -> dict:
        now = time.monotonic()
        active = sum(1 for _, (_, exp) in self._store.items() if exp > now)
        return {"size": len(self._store), "active": active, "max": self._max, "ttl_seconds": self._ttl}


# ---------------------------------------------------------------------------
# Module-level singleton — import this everywhere you need the cache
# ---------------------------------------------------------------------------

review_cache = _TTLCache(ttl_seconds=300, max_size=200)
