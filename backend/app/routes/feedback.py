"""Feedback routes — /feedback/*"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.middleware.auth import CurrentUser, optional_auth
from app.middleware.error_handler import AppError
from app.services.feedback_service import send_feedback_email

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)


@router.post("/send")
async def send_feedback(
    body: FeedbackRequest,
    user: CurrentUser | None = Depends(optional_auth),
):
    """Send user feedback via email. Auth is optional — anonymous feedback is allowed."""
    user_email = user.email if user else None
    result = await send_feedback_email(message=body.message, user_email=user_email)

    if not result.get("success"):
        raise AppError(status_code=502, message=result.get("error", "Failed to send feedback."))

    return {"success": True, "message": "Feedback sent — thank you!"}
