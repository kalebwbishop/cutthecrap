from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional
import base64
import json
from urllib.parse import quote, urlencode

from app.config.settings import get_settings
from app.config.workos_client import get_workos_client
from app.middleware.auth import CurrentUser, get_current_user
from app.services import auth_service
from app.utils.logger import logger


router = APIRouter(prefix="/auth", tags=["auth"])


# ── request / response models ────────────────────────────────────────


class ExchangePayload(BaseModel):
    data: dict  # expects {"code": "..."}


class RefreshPayload(BaseModel):
    refreshToken: str


class UserOut(BaseModel):
    id: str
    workosUserId: str
    email: str
    name: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


# ── GET /auth/login ──────────────────────────────────────────────────


@router.get("/login")
async def login(redirect_uri: Optional[str] = None):
    """Initiate WorkOS OAuth / AuthKit flow.

    Args:
        redirect_uri: Optional deep-link URI the callback should redirect to
                      (e.g. ``dwellary://auth``). Passed through WorkOS ``state``
                      so it survives the OAuth round-trip. When omitted the
                      callback falls back to the configured ``frontend_url``.
    """
    try:
        settings = get_settings()
        workos = get_workos_client()

        # Encode the mobile redirect into state so the callback can use it
        state_payload: Optional[str] = None
        if redirect_uri:
            state_payload = base64.urlsafe_b64encode(
                json.dumps({"redirect_uri": redirect_uri}).encode()
            ).decode()

        authorization_url = workos.user_management.get_authorization_url(
            provider="authkit",
            redirect_uri=settings.workos_redirect_uri,
            state=state_payload,
        )

        return {"authorizationUrl": authorization_url}
    except Exception:
        logger.error("Login initiation failed", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "message": "Failed to initiate login"},
        )


# ── GET /auth/callback ──────────────────────────────────────────────


@router.get("/callback")
async def callback(code: Optional[str] = None, state: Optional[str] = None):
    """Redirect back to the frontend (or mobile deep-link) with the authorization code."""
    if not code:
        return JSONResponse(
            status_code=400,
            content={"error": "Bad Request", "message": "Authorization code is required"},
        )
    logger.info("OAuth callback received (state=%s)", "present" if state else "absent")

    # Determine where to redirect: deep-link from state, or default frontend URL
    settings = get_settings()
    redirect_target = settings.frontend_url + "/home"

    if state:
        try:
            # Pad the base64 string if needed (= padding may get stripped by URL encoding)
            padded = state + "=" * (-len(state) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
            custom_redirect = payload.get("redirect_uri")
            if custom_redirect:
                redirect_target = custom_redirect
                logger.info("Decoded redirect_uri from state: %s", redirect_target)
        except Exception:
            logger.warning("Failed to decode state parameter, using default redirect", exc_info=True)

    separator = "&" if "?" in redirect_target else "?"
    final_url = f"{redirect_target}{separator}code={quote(code, safe='')}"
    logger.info("Callback redirecting (302) to: %s", final_url)

    # Use a 302 redirect. ASWebAuthenticationSession on iOS intercepts HTTP
    # redirects to custom URL schemes (exp://, dwellary://) and closes the
    # in-app browser automatically.  (JavaScript navigations are NOT intercepted,
    # so we must use a real HTTP redirect here.)
    return RedirectResponse(url=final_url, status_code=302)


# ── POST /auth/exchange ─────────────────────────────────────────────


@router.post("/exchange")
async def exchange(payload: ExchangePayload):
    """Exchange an authorization code for user profile + access token."""
    try:
        code = payload.data.get("code")
        if not code or not isinstance(code, str):
            return JSONResponse(
                status_code=400,
                content={"error": "Bad Request", "message": "Authorization code is required"},
            )

        workos = get_workos_client()

        auth_response = workos.user_management.authenticate_with_code(
            code=code,
        )

        user = auth_response.user
        access_token = auth_response.access_token
        refresh_token = getattr(auth_response, 'refresh_token', None)

        # Look up or create user via the auth service
        try:
            db_user = await auth_service.find_user_by_workos_id(user.id)
        except Exception as e:
            logger.error("Database query failed: %s", str(e), exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"error": "Internal Server Error", "message": "Failed to fetch user data"},
            )

        if db_user is None:
            db_user = await auth_service.create_user(
                workos_user_id=user.id,
                email=user.email,
                name=f"{user.first_name} {user.last_name}",
            )

        user_out = {
            "id": str(db_user["id"]),
            "workosUserId": db_user["workos_user_id"],
            "email": db_user["email"],
            "name": db_user["name"],
            "createdAt": str(db_user["created_at"]) if db_user.get("created_at") else None,
            "updatedAt": str(db_user["updated_at"]) if db_user.get("updated_at") else None,
        }


        logger.info("OAuth exchange successful for user: %s", user.email)

        response_data = {"user": user_out, "accessToken": access_token}
        if refresh_token:
            response_data["refreshToken"] = refresh_token
        return response_data

    except Exception as e:
        logger.error("OAuth exchange failed: %s", str(e), exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "Authentication failed",
                "detail": f"{type(e).__name__}: {e}",
            },
        )


# ── POST /auth/refresh ───────────────────────────────────────────────


@router.post("/refresh")
async def refresh(payload: RefreshPayload):
    """Exchange a refresh token for a new access token (and a rotated refresh token)."""
    try:
        workos = get_workos_client()

        auth_response = workos.user_management.authenticate_with_refresh_token(
            refresh_token=payload.refreshToken,
        )

        access_token = auth_response.access_token
        new_refresh_token = getattr(auth_response, 'refresh_token', None)

        response_data = {"accessToken": access_token}
        if new_refresh_token:
            response_data["refreshToken"] = new_refresh_token

        logger.info("Token refresh successful")
        return response_data

    except Exception as e:
        logger.error("Token refresh failed: %s", str(e), exc_info=True)
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized", "message": "Refresh token is invalid or expired"},
        )


# ── GET /auth/me ─────────────────────────────────────────────────────


@router.get("/me")
async def me(current_user: CurrentUser = Depends(get_current_user)):
    """Return the authenticated user's full profile."""
    try:
        user_data = await auth_service.get_user_with_profile(
            current_user.workos_user_id
        )

        if user_data is None:
            return JSONResponse(
                status_code=404, content={"error": "User not found"}
            )

        return {"user": user_data}

    except Exception:
        logger.error("Get current user failed", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "Failed to fetch user data",
            },
        )


# ── DELETE /auth/account ──────────────────────────────────────────────


@router.delete("/account")
async def delete_account(current_user: CurrentUser = Depends(get_current_user)):
    """Permanently delete the authenticated user's account and all associated data."""
    try:
        # Delete user from local database (cascades to saved_recipes + recipe_history)
        deleted = await auth_service.delete_user(current_user.id)
        if not deleted:
            return JSONResponse(
                status_code=404,
                content={"error": "Not Found", "message": "User not found"},
            )

        # Best-effort: delete the user from WorkOS as well
        try:
            workos = get_workos_client()
            workos.user_management.delete_user(user_id=current_user.workos_user_id)
        except Exception:
            logger.warning("Failed to delete user from WorkOS (local deletion succeeded)", exc_info=True)

        logger.info("Account deleted for user: %s", current_user.id)
        return {"message": "Account deleted successfully"}

    except Exception:
        logger.error("Account deletion failed", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "message": "Failed to delete account"},
        )


# ── POST /auth/logout ───────────────────────────────────────────────


@router.post("/logout")
async def logout(current_user: CurrentUser = Depends(get_current_user)):
    """Logout the user by revoking the session via WorkOS."""
    try:
        workos = get_workos_client()

        logout_url = workos.user_management.get_logout_url(
            session_id=current_user.session_id,
        )

        return {"message": "Logged out successfully", "logoutUrl": logout_url}
    except Exception:
        logger.error("Logout failed", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "message": "Failed to logout"},
        )
