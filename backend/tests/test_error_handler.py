"""Tests for app.middleware.error_handler – AppError and handler functions."""

import asyncio

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.middleware.error_handler import AppError, app_error_handler, generic_error_handler


class TestAppError:
    def test_default_status_code(self):
        err = AppError("something broke")
        assert err.message == "something broke"
        assert err.status_code == 500

    def test_custom_status_code(self):
        err = AppError("not found", status_code=404)
        assert err.status_code == 404

    def test_inherits_from_exception(self):
        err = AppError("fail")
        assert isinstance(err, Exception)

    def test_str_representation(self):
        err = AppError("test error")
        assert str(err) == "test error"


class TestAppErrorHandler:
    @pytest.mark.asyncio
    async def test_returns_correct_status_and_body(self):
        request = MagicMock()
        request.method = "GET"
        request.url.path = "/api/test"
        exc = AppError("Resource not found", status_code=404)

        response = await app_error_handler(request, exc)

        assert response.status_code == 404
        assert response.body == b'{"error":{"message":"Resource not found"}}'

    @pytest.mark.asyncio
    async def test_500_error(self):
        request = MagicMock()
        request.method = "POST"
        request.url.path = "/api/data"
        exc = AppError("Server failure")

        response = await app_error_handler(request, exc)

        assert response.status_code == 500


class TestGenericErrorHandler:
    @pytest.mark.asyncio
    async def test_always_returns_500(self):
        request = MagicMock()
        request.method = "GET"
        request.url.path = "/api/explode"
        exc = RuntimeError("unexpected")

        response = await generic_error_handler(request, exc)

        assert response.status_code == 500
        assert b"Internal Server Error" in response.body

    @pytest.mark.asyncio
    async def test_does_not_leak_error_details(self):
        request = MagicMock()
        request.method = "GET"
        request.url.path = "/api/secret"
        exc = ValueError("secret DB password in traceback")

        response = await generic_error_handler(request, exc)

        assert b"secret DB password" not in response.body
        assert b"Internal Server Error" in response.body

    @pytest.mark.asyncio
    async def test_schedules_error_email(self):
        request = MagicMock()
        request.method = "POST"
        request.url.path = "/api/boom"
        exc = RuntimeError("kaboom")

        mock_send = AsyncMock(return_value={"success": True})
        with patch("app.services.feedback_service.send_error_email", mock_send):
            response = await generic_error_handler(request, exc)

            # Let the background task run
            await asyncio.sleep(0.1)

        assert response.status_code == 500
        mock_send.assert_awaited_once_with(exc=exc, method="POST", path="/api/boom")

    @pytest.mark.asyncio
    async def test_error_email_failure_does_not_affect_response(self):
        request = MagicMock()
        request.method = "GET"
        request.url.path = "/api/fail"
        exc = RuntimeError("something bad")

        mock_send = AsyncMock(side_effect=Exception("email service down"))
        with patch("app.services.feedback_service.send_error_email", mock_send):
            response = await generic_error_handler(request, exc)
            await asyncio.sleep(0.1)

        assert response.status_code == 500
        assert b"Internal Server Error" in response.body
