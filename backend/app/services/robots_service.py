"""
robots.txt compliance service.

Fetches, parses, and caches robots.txt files so the scraper can respect
disallow directives before requesting a page.
"""

from __future__ import annotations

import time
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

from app.utils.logger import logger

# Cache robots.txt results for 1 hour
_CACHE_TTL_SECONDS = 3600

# Our honest user-agent token (short form used in robots.txt matching)
USER_AGENT_TOKEN = "CutTheCrap"

# Timeout for fetching robots.txt itself
_ROBOTS_TIMEOUT = 10.0


class _CacheEntry:
    __slots__ = ("parser", "fetched_at")

    def __init__(self, parser: RobotFileParser, fetched_at: float) -> None:
        self.parser = parser
        self.fetched_at = fetched_at


# domain → cached parser
_cache: dict[str, _CacheEntry] = {}


def _robots_url(url: str) -> str:
    """Derive the robots.txt URL from an arbitrary page URL."""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


async def _fetch_robots(robots_url: str, *, verify_ssl: bool = True) -> RobotFileParser:
    """Download and parse a robots.txt file.

    If the file cannot be fetched (404, timeout, etc.) we return a parser
    that allows everything — matching standard crawler behaviour.
    """
    parser = RobotFileParser()
    parser.set_url(robots_url)

    try:
        async with httpx.AsyncClient(
            timeout=_ROBOTS_TIMEOUT,
            follow_redirects=True,
            verify=verify_ssl,
        ) as client:
            resp = await client.get(robots_url)

        if resp.status_code == 200:
            parser.parse(resp.text.splitlines())
            logger.debug("Parsed robots.txt from %s", robots_url)
        else:
            # 404, 403, etc. — treat as "allow everything"
            parser.parse([])
            logger.debug("robots.txt at %s returned %d — allowing all", robots_url, resp.status_code)
    except (httpx.RequestError, httpx.TimeoutException) as exc:
        # Network failure — allow everything (don't block users on transient errors)
        parser.parse([])
        logger.warning("Could not fetch robots.txt from %s: %s — allowing all", robots_url, exc)

    return parser


def _cache_key(url: str) -> str:
    """Normalise to scheme + netloc for cache lookups."""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


async def is_allowed(url: str, *, verify_ssl: bool = True) -> bool:
    """Return True if our user-agent is allowed to fetch *url* per robots.txt.

    Results are cached per domain for ``_CACHE_TTL_SECONDS``.
    """
    key = _cache_key(url)
    now = time.monotonic()

    entry = _cache.get(key)
    if entry is None or (now - entry.fetched_at) > _CACHE_TTL_SECONDS:
        robots_url = _robots_url(url)
        parser = await _fetch_robots(robots_url, verify_ssl=verify_ssl)
        _cache[key] = _CacheEntry(parser=parser, fetched_at=now)
        entry = _cache[key]

    allowed = entry.parser.can_fetch(USER_AGENT_TOKEN, url)
    if not allowed:
        logger.info("robots.txt disallows fetching %s", url)

    return allowed
