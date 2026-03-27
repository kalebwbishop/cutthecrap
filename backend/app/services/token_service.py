"""OAuth2 client-credentials token manager for the Deploy Box APIs proxy.

Acquires and caches an Entra ID bearer token using a client_id / client_secret
pair. The token is refreshed automatically when it expires (or is within a
60-second buffer of expiring).
"""

from __future__ import annotations

import asyncio
import base64
import time

import httpx

from app.config.settings import get_settings
from app.utils.logger import logger

_TENANT_ID = "13948c46-2012-4ee2-9594-cd6e4cab3026"
_TOKEN_URL = f"https://login.microsoftonline.com/{_TENANT_ID}/oauth2/v2.0/token"
_AUDIENCE = "222d8030-c502-46d6-b2a0-ca1051c31980"
_SCOPE = f"{_AUDIENCE}/.default"

# Buffer in seconds — refresh the token before it actually expires.
_EXPIRY_BUFFER = 60

# Module-level cache
_cached_token: str | None = None
_cached_expiry: float = 0.0
_lock = asyncio.Lock()


def _decode_client_id(encoded: str) -> str:
    """The Deploy Box self-service system base64-encodes the client_id UUID."""
    try:
        return base64.b64decode(encoded).decode("utf-8")
    except Exception:
        # If it's already a plain UUID, return as-is
        return encoded


async def get_bearer_token() -> str | None:
    """Return a valid bearer token, fetching a new one if necessary.

    Returns ``None`` if credentials are not configured or the token
    request fails.
    """
    global _cached_token, _cached_expiry

    # Fast path — token still valid
    if _cached_token and time.time() < _cached_expiry:
        return _cached_token

    async with _lock:
        # Re-check after acquiring lock (another coroutine may have refreshed)
        if _cached_token and time.time() < _cached_expiry:
            return _cached_token

        settings = get_settings()
        if not settings.deploy_box_client_id or not settings.deploy_box_client_secret:
            logger.warning("DEPLOY_BOX_CLIENT_ID / DEPLOY_BOX_CLIENT_SECRET not configured")
            return None

        client_id = _decode_client_id(settings.deploy_box_client_id)

        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": settings.deploy_box_client_secret,
            "scope": _SCOPE,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(_TOKEN_URL, data=data)
        except httpx.RequestError as exc:
            logger.error("Token request failed: %s", exc)
            _cached_token = None
            return None

        if resp.status_code != 200:
            logger.error("Token endpoint returned %d: %s", resp.status_code, resp.text[:300])
            _cached_token = None
            return None

        body = resp.json()
        _cached_token = body["access_token"]
        # Cache until `expires_in` minus buffer
        _cached_expiry = time.time() + body.get("expires_in", 3600) - _EXPIRY_BUFFER
        logger.info("Acquired new Deploy Box bearer token (expires in %ds)", body.get("expires_in", 0))
        return _cached_token
