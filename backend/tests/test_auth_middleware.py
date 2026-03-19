"""Tests for app.middleware.auth – JWT verification and user resolution."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from app.middleware.auth import CurrentUser, get_current_user, optional_auth
from tests.conftest import make_record


def _make_request(auth_header: str = "") -> MagicMock:
    request = MagicMock()
    headers = {"Authorization": auth_header} if auth_header else {}
    request.headers.get = lambda key, default="": headers.get(key, default)
    return request


class TestCurrentUser:
    def test_dataclass_fields(self):
        user = CurrentUser(
            id="1", workos_user_id="wos_1", email="a@b.com", name="Alice"
        )
        assert user.id == "1"
        assert user.session_id == ""

    def test_session_id_override(self):
        user = CurrentUser(
            id="1", workos_user_id="wos_1", email="a@b.com", name="Alice",
            session_id="sess_123",
        )
        assert user.session_id == "sess_123"


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_missing_auth_header_raises_401(self):
        request = _make_request("")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        assert exc_info.value.status_code == 401
        assert "No authentication token" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_malformed_auth_header_raises_401(self):
        request = _make_request("Basic abc123")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_pool")
    @patch("app.middleware.auth._get_jwks_client")
    async def test_invalid_jwt_raises_401(self, mock_jwks, mock_get_pool):
        mock_jwks_client = MagicMock()
        mock_jwks_client.get_signing_key_from_jwt.side_effect = Exception("Invalid JWT")
        mock_jwks.return_value = mock_jwks_client

        request = _make_request("Bearer invalid.token.here")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        assert exc_info.value.status_code == 401
        assert "Invalid or expired token" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_pool")
    @patch("app.middleware.auth.pyjwt.decode")
    @patch("app.middleware.auth._get_jwks_client")
    async def test_missing_sub_claim_raises_401(self, mock_jwks, mock_decode, mock_get_pool):
        mock_jwks_client = MagicMock()
        mock_jwks_client.get_signing_key_from_jwt.return_value = MagicMock(key="test-key")
        mock_jwks.return_value = mock_jwks_client
        mock_decode.return_value = {"iss": "workos"}  # no "sub" claim

        request = _make_request("Bearer valid.token.here")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        assert exc_info.value.status_code == 401
        assert "sub" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_pool")
    @patch("app.middleware.auth.pyjwt.decode")
    @patch("app.middleware.auth._get_jwks_client")
    async def test_db_failure_raises_500(self, mock_jwks, mock_decode, mock_get_pool):
        mock_jwks_client = MagicMock()
        mock_jwks_client.get_signing_key_from_jwt.return_value = MagicMock(key="test-key")
        mock_jwks.return_value = mock_jwks_client
        mock_decode.return_value = {"sub": "user_01ABC", "sid": "sess_1"}

        mock_pool = AsyncMock()
        mock_pool.fetchrow.side_effect = Exception("DB down")
        mock_get_pool.return_value = mock_pool

        request = _make_request("Bearer valid.token.here")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_pool")
    @patch("app.middleware.auth.pyjwt.decode")
    @patch("app.middleware.auth._get_jwks_client")
    async def test_user_not_found_raises_401(self, mock_jwks, mock_decode, mock_get_pool):
        mock_jwks_client = MagicMock()
        mock_jwks_client.get_signing_key_from_jwt.return_value = MagicMock(key="test-key")
        mock_jwks.return_value = mock_jwks_client
        mock_decode.return_value = {"sub": "user_01ABC", "sid": "sess_1"}

        mock_pool = AsyncMock()
        mock_pool.fetchrow.return_value = None
        mock_get_pool.return_value = mock_pool

        request = _make_request("Bearer valid.token.here")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        assert exc_info.value.status_code == 401
        assert "not found" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_pool")
    @patch("app.middleware.auth.pyjwt.decode")
    @patch("app.middleware.auth._get_jwks_client")
    async def test_success_returns_current_user(self, mock_jwks, mock_decode, mock_get_pool):
        mock_jwks_client = MagicMock()
        mock_jwks_client.get_signing_key_from_jwt.return_value = MagicMock(key="test-key")
        mock_jwks.return_value = mock_jwks_client
        mock_decode.return_value = {"sub": "user_01ABC", "sid": "sess_1"}

        user_row = make_record({
            "id": "uuid-1",
            "workos_user_id": "user_01ABC",
            "email": "test@example.com",
            "name": "Test User",
        })
        mock_pool = AsyncMock()
        mock_pool.fetchrow.return_value = user_row
        mock_get_pool.return_value = mock_pool

        request = _make_request("Bearer valid.token.here")
        user = await get_current_user(request)

        assert isinstance(user, CurrentUser)
        assert user.id == "uuid-1"
        assert user.email == "test@example.com"
        assert user.session_id == "sess_1"


class TestOptionalAuth:
    @pytest.mark.asyncio
    async def test_returns_none_without_auth_header(self):
        request = MagicMock()
        request.headers.get = lambda key, default="": default
        result = await optional_auth(request)
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_with_non_bearer_header(self):
        request = MagicMock()
        request.headers.get = lambda key, default="": "Basic abc" if key == "authorization" else default
        result = await optional_auth(request)
        assert result is None

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_current_user")
    async def test_returns_none_on_auth_failure(self, mock_get_current_user):
        mock_get_current_user.side_effect = HTTPException(status_code=401, detail="bad token")
        request = MagicMock()
        request.headers.get = lambda key, default="": "Bearer bad.token" if key == "authorization" else default
        result = await optional_auth(request)
        assert result is None

    @pytest.mark.asyncio
    @patch("app.middleware.auth.get_current_user")
    async def test_returns_user_on_success(self, mock_get_current_user):
        expected = CurrentUser(id="1", workos_user_id="wos_1", email="a@b.com", name="Alice")
        mock_get_current_user.return_value = expected
        request = MagicMock()
        request.headers.get = lambda key, default="": "Bearer good.token" if key == "authorization" else default
        result = await optional_auth(request)
        assert result is expected
