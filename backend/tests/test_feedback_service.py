"""Tests for app.services.feedback_service – feedback and error-report emails."""

import time

import httpx
import pytest
from unittest.mock import AsyncMock, patch

from app.services import feedback_service
from app.services.feedback_service import (
    _ERROR_EMAIL_COOLDOWN_SECS,
    _error_signature,
    _is_throttled,
    _recent_error_emails,
    send_error_email,
    send_feedback_email,
)


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Reset the throttle cache between tests."""
    _recent_error_emails.clear()
    yield
    _recent_error_emails.clear()


def _make_exc():
    """Create an exception with a real traceback."""
    try:
        raise ValueError("test error message")
    except ValueError as e:
        return e


class TestErrorSignature:
    def test_same_error_same_path_produces_same_sig(self):
        exc1 = _make_exc()
        exc2 = _make_exc()
        assert _error_signature(exc1, "/api/x") == _error_signature(exc2, "/api/x")

    def test_different_path_produces_different_sig(self):
        exc = _make_exc()
        assert _error_signature(exc, "/api/a") != _error_signature(exc, "/api/b")


class TestThrottle:
    def test_not_throttled_initially(self):
        assert not _is_throttled("abc")

    def test_throttled_after_recording(self):
        _recent_error_emails["abc"] = time.time()
        assert _is_throttled("abc")

    def test_not_throttled_after_cooldown(self):
        _recent_error_emails["abc"] = time.time() - _ERROR_EMAIL_COOLDOWN_SECS - 1
        assert not _is_throttled("abc")


class TestSendErrorEmail:
    @pytest.mark.asyncio
    async def test_sends_email_with_traceback(self):
        exc = _make_exc()
        mock_post = AsyncMock(return_value={"success": True})

        with patch.object(feedback_service, "_post_email", mock_post):
            result = await send_error_email(exc=exc, method="GET", path="/api/test")

        assert result["success"] is True
        mock_post.assert_awaited_once()

        payload = mock_post.call_args[0][0]
        assert "⚠️ Cut The Crap Error" in payload["subject"]
        assert "ValueError" in payload["subject"]
        assert "test error message" in payload["html_content"]
        assert "Stack Trace" in payload["html_content"]

    @pytest.mark.asyncio
    async def test_html_escapes_dangerous_content(self):
        try:
            raise ValueError("<script>alert('xss')</script>")
        except ValueError as exc:
            mock_post = AsyncMock(return_value={"success": True})
            with patch.object(feedback_service, "_post_email", mock_post):
                await send_error_email(exc=exc, method="GET", path="/api/<evil>")

            payload = mock_post.call_args[0][0]
            assert "<script>" not in payload["html_content"]
            assert "&lt;script&gt;" in payload["html_content"]
            assert "&lt;evil&gt;" in payload["html_content"]

    @pytest.mark.asyncio
    async def test_throttles_duplicate_errors(self):
        exc = _make_exc()
        mock_post = AsyncMock(return_value={"success": True})

        with patch.object(feedback_service, "_post_email", mock_post):
            r1 = await send_error_email(exc=exc, method="GET", path="/api/test")
            r2 = await send_error_email(exc=exc, method="GET", path="/api/test")

        assert r1["success"] is True
        assert r2["success"] is False
        assert r2["error"] == "Throttled"
        assert mock_post.await_count == 1


class TestSendFeedbackEmail:
    @pytest.mark.asyncio
    async def test_sends_feedback(self):
        mock_post = AsyncMock(return_value={"success": True})

        with patch.object(feedback_service, "_post_email", mock_post):
            result = await send_feedback_email(message="Great app!", user_email="u@test.com")

        assert result["success"] is True
        payload = mock_post.call_args[0][0]
        assert "Feedback" in payload["subject"]
        assert "Great app!" in payload["html_content"]

    @pytest.mark.asyncio
    async def test_html_escapes_user_input(self):
        mock_post = AsyncMock(return_value={"success": True})

        with patch.object(feedback_service, "_post_email", mock_post):
            await send_feedback_email(message="<b>bold</b>", user_email="a@b.com")

        payload = mock_post.call_args[0][0]
        assert "<b>" not in payload["html_content"]
        assert "&lt;b&gt;" in payload["html_content"]
