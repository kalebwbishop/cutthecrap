"""Service for sending feedback emails via the Azure Function email endpoint."""

from __future__ import annotations

import httpx

from app.config.settings import get_settings
from app.utils.logger import logger


FEEDBACK_RECIPIENT = "kalebwbishop+ctcfeedback@gmail.com"


async def send_feedback_email(*, message: str, user_email: str | None = None) -> dict:
    """Send a feedback email through the Azure Function at
    ``CHATGPT_API_BASE/api/v1/email``.

    Returns ``{"success": True}`` on success, or
    ``{"success": False, "error": "..."}`` on failure.
    """
    settings = get_settings()

    # Prefer OAuth2 client credentials; fall back to legacy API key
    from app.services.token_service import get_bearer_token

    bearer = await get_bearer_token()
    if bearer:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {bearer}",
        }
    elif settings.openai_api_key:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": settings.openai_api_key,
        }
    else:
        return {"success": False, "error": "Deploy Box API credentials are not configured on the server."}

    url = f"{settings.chatgpt_api_base.rstrip('/')}/api/v1/email"

    from_label = user_email or "Anonymous"
    html_content = (
        "<body>"
        "<h2>New Feedback — Cut The Crap</h2>"
        f"<p><strong>From:</strong> {from_label}</p>"
        f"<p>{message}</p>"
        "</body>"
    )

    payload = {
        "to_emails": [FEEDBACK_RECIPIENT],
        "subject": f"Cut The Crap Feedback — {from_label}",
        "html_content": html_content,
    }

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
        return {
            "success": False,
            "error": f"Email service returned {resp.status_code}",
        }

    logger.info("Feedback email sent successfully for %s", from_label)
    return {"success": True}
