"""Service for sending feedback and error-report emails via the Azure Function email endpoint."""

from __future__ import annotations

import hashlib
import html
import time
import traceback

import httpx

from app.config.settings import get_settings
from app.utils.logger import logger


FEEDBACK_RECIPIENT = "kalebwbishop+ctcfeedback@gmail.com"

# ── error-email throttle ────────────────────────────────────────────
# Simple in-memory cooldown keyed by (exception type, top frame, path)
# to prevent email storms from a single recurring error.
_ERROR_EMAIL_COOLDOWN_SECS = 300  # 5 minutes
_recent_error_emails: dict[str, float] = {}


def _error_signature(exc: Exception, request_path: str) -> str:
    """Return a short hash that identifies a recurring error."""
    tb = traceback.extract_tb(exc.__traceback__)
    top_frame = f"{tb[-1].filename}:{tb[-1].lineno}" if tb else "unknown"
    raw = f"{type(exc).__name__}|{top_frame}|{request_path}"
    return hashlib.md5(raw.encode()).hexdigest()


def _is_throttled(sig: str) -> bool:
    last = _recent_error_emails.get(sig, 0.0)
    return (time.time() - last) < _ERROR_EMAIL_COOLDOWN_SECS


def _record_sent(sig: str) -> None:
    _recent_error_emails[sig] = time.time()


# ── shared helpers ───────────────────────────────────────────────────


async def _get_email_headers() -> dict | None:
    """Build auth headers for the email endpoint, or return None if unconfigured."""
    settings = get_settings()

    from app.services.token_service import get_bearer_token

    bearer = await get_bearer_token()
    if bearer:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {bearer}",
        }
    if settings.openai_api_key:
        return {
            "Content-Type": "application/json",
            "x-api-key": settings.openai_api_key,
        }
    return None


async def _post_email(payload: dict) -> dict:
    """POST *payload* to the email endpoint and return a success/error dict."""
    settings = get_settings()
    url = f"{settings.chatgpt_api_base.rstrip('/')}/api/v1/email"

    headers = await _get_email_headers()
    if headers is None:
        return {"success": False, "error": "Deploy Box API credentials are not configured on the server."}

    try:
        async with httpx.AsyncClient(timeout=15, verify=not settings.is_dev) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.TimeoutException:
        logger.error("Email endpoint timed out: %s", url)
        return {"success": False, "error": "Email service timed out."}
    except httpx.RequestError as exc:
        logger.error("Email endpoint request error: %s", exc)
        return {"success": False, "error": "Could not reach the email service."}

    if resp.status_code != 200:
        logger.error("Email endpoint error %d: %s", resp.status_code, resp.text[:500])
        return {"success": False, "error": f"Email service returned {resp.status_code}"}

    return {"success": True}


# ── public API ───────────────────────────────────────────────────────


async def send_feedback_email(*, message: str, user_email: str | None = None) -> dict:
    """Send a feedback email through the Azure Function at
    ``CHATGPT_API_BASE/api/v1/email``.

    Returns ``{"success": True}`` on success, or
    ``{"success": False, "error": "..."}`` on failure.
    """
    from_label = user_email or "Anonymous"
    html_content = (
        "<body>"
        "<h2>New Feedback — Cut The Crap</h2>"
        f"<p><strong>From:</strong> {html.escape(from_label)}</p>"
        f"<p>{html.escape(message)}</p>"
        "</body>"
    )

    payload = {
        "to_emails": [FEEDBACK_RECIPIENT],
        "subject": f"Cut The Crap Feedback — {from_label}",
        "html_content": html_content,
    }

    result = await _post_email(payload)
    if result["success"]:
        logger.info("Feedback email sent successfully for %s", from_label)
    return result


async def send_error_email(
    *,
    exc: Exception,
    method: str,
    path: str,
) -> dict:
    """Send an error-report email with the exception details and stack trace.

    Throttled so the same error signature is only emailed once per cooldown
    period (default 5 min).
    """
    sig = _error_signature(exc, path)
    if _is_throttled(sig):
        logger.debug("Error email throttled for %s %s (%s)", method, path, type(exc).__name__)
        return {"success": False, "error": "Throttled"}

    tb_lines = traceback.format_exception(type(exc), exc, exc.__traceback__)
    tb_text = html.escape("".join(tb_lines))
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    html_content = (
        "<body>"
        "<h2>⚠️ Unhandled Error — Cut The Crap</h2>"
        f"<p><strong>Time:</strong> {html.escape(timestamp)}</p>"
        f"<p><strong>Request:</strong> {html.escape(method)} {html.escape(path)}</p>"
        f"<p><strong>Error:</strong> {html.escape(type(exc).__name__)}: {html.escape(str(exc))}</p>"
        "<h3>Stack Trace</h3>"
        f"<pre style=\"background:#f4f4f4;padding:12px;overflow-x:auto;\">{tb_text}</pre>"
        "</body>"
    )

    payload = {
        "to_emails": [FEEDBACK_RECIPIENT],
        "subject": f"⚠️ Cut The Crap Error — {type(exc).__name__}",
        "html_content": html_content,
    }

    result = await _post_email(payload)
    if result["success"]:
        _record_sent(sig)
        logger.info("Error email sent for %s %s (%s)", method, path, type(exc).__name__)
    return result
