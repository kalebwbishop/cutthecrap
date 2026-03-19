from dataclasses import dataclass
from functools import lru_cache
from typing import Union

import jwt as pyjwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request

from app.config.database import get_pool
from app.config.workos_client import get_workos_client
from app.utils.logger import logger


@lru_cache(maxsize=1)
def _get_jwks_client() -> PyJWKClient:
    """Return a cached JWKS client for verifying WorkOS access tokens."""
    workos = get_workos_client()
    jwks_url = workos.user_management.get_jwks_url()
    return PyJWKClient(jwks_url)


@dataclass
class CurrentUser:
    id: str
    workos_user_id: str
    email: str
    name: str
    session_id: str = ""


async def get_current_user(request: Request) -> CurrentUser:
    """FastAPI dependency that verifies the bearer token (JWT access token)
    via WorkOS JWKS and resolves the internal user from the database."""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "Unauthorized", "message": "No authentication token provided"},
        )

    access_token = auth_header.removeprefix("Bearer ")

    # ── Step 1: Verify the JWT signature and claims via JWKS ─────────
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(access_token)
        decoded = pyjwt.decode(
            access_token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=30,  # tolerate up to 30s clock skew between WorkOS and local machine
        )
    except Exception:
        logger.error("JWT verification failed", exc_info=True)
        raise HTTPException(
            status_code=401,
            detail={"error": "Unauthorized", "message": "Invalid or expired token"},
        )

    workos_user_id = decoded.get("sub")
    if not workos_user_id:
        raise HTTPException(
            status_code=401,
            detail={"error": "Unauthorized", "message": "Token missing 'sub' claim"},
        )

    session_id = decoded.get("sid", "")

    # ── Step 2: Resolve the user from the local database ─────────────
    # Avoids a network round-trip to WorkOS on every authenticated request.
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "SELECT id, workos_user_id, email, name FROM users WHERE workos_user_id = $1",
            workos_user_id,
        )
    except Exception:
        logger.error("Database lookup failed for workos_user_id=%s", workos_user_id, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "Internal Server Error", "message": "Failed to verify user"},
        )

    if row is None:
        logger.warning("Authenticated token for unknown user: %s", workos_user_id)
        raise HTTPException(
            status_code=401,
            detail={"error": "Unauthorized", "message": "User account not found"},
        )

    return CurrentUser(
        id=str(row["id"]),
        workos_user_id=row["workos_user_id"],
        email=row["email"],
        name=row["name"] or "",
        session_id=session_id,
    )


async def optional_auth(request: Request) -> Union[CurrentUser, None]:
    """Same as get_current_user but returns None instead of raising."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    try:
        return await get_current_user(request)
    except HTTPException:
        return None
