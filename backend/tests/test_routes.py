"""Tests for route endpoints using FastAPI TestClient."""

import base64
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.middleware.auth import CurrentUser, get_current_user


# ── Helpers ──────────────────────────────────────────────────────────


FAKE_USER = CurrentUser(
    id="00000000-0000-0000-0000-000000000001",
    workos_user_id="user_01ABC",
    email="test@example.com",
    name="Test User",
    session_id="sess_1",
)


def _get_test_client(*, override_auth: bool = False):
    """Import and return a TestClient wrapping the app.

    When override_auth=True, replaces the get_current_user dependency
    so routes requiring auth accept any request.
    """
    from app.main import app

    if override_auth:
        app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    else:
        app.dependency_overrides.pop(get_current_user, None)

    return TestClient(app, raise_server_exceptions=False)


# ═════════════════════════════════════════════════════════════════════
# Health & Status endpoints
# ═════════════════════════════════════════════════════════════════════


class TestHealthEndpoint:
    @patch("app.main.get_pool")
    def test_healthy(self, mock_get_pool):
        mock_pool = AsyncMock()
        mock_pool.fetchval.return_value = 1
        mock_get_pool.return_value = mock_pool

        client = _get_test_client()
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"

    @patch("app.main.get_pool")
    def test_unhealthy(self, mock_get_pool):
        mock_get_pool.side_effect = Exception("DB unreachable")

        client = _get_test_client()
        response = client.get("/api/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"


class TestStatusEndpoint:
    def test_returns_status(self):
        client = _get_test_client()
        response = client.get("/api/v1/status")
        assert response.status_code == 200
        data = response.json()
        assert "Cut The Crap" in data["message"]
        assert data["version"] == "1.0.0"


class TestNotFoundHandler:
    def test_unknown_route_returns_404(self):
        client = _get_test_client()
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "Not Found"
        assert "/api/v1/nonexistent" in data["message"]


# ═════════════════════════════════════════════════════════════════════
# Auth routes
# ═════════════════════════════════════════════════════════════════════


class TestAuthCallback:
    def test_missing_code_returns_400(self):
        client = _get_test_client()
        response = client.get("/api/v1/auth/callback", follow_redirects=False)
        assert response.status_code == 400

    def test_redirects_with_code(self):
        client = _get_test_client()
        response = client.get(
            "/api/v1/auth/callback?code=abc123", follow_redirects=False
        )
        assert response.status_code == 302
        location = response.headers["location"]
        assert "code=abc123" in location

    def test_state_decoding_and_redirect(self):
        state_data = {"redirect_uri": "cutthecrap://auth"}
        state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

        client = _get_test_client()
        response = client.get(
            f"/api/v1/auth/callback?code=abc123&state={state}",
            follow_redirects=False,
        )
        assert response.status_code == 302
        location = response.headers["location"]
        assert location.startswith("cutthecrap://auth")
        assert "code=abc123" in location

    def test_separator_logic_with_existing_query(self):
        state_data = {"redirect_uri": "cutthecrap://auth?extra=1"}
        state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

        client = _get_test_client()
        response = client.get(
            f"/api/v1/auth/callback?code=abc123&state={state}",
            follow_redirects=False,
        )
        location = response.headers["location"]
        assert "&code=abc123" in location

    def test_code_with_special_chars_is_url_encoded(self):
        client = _get_test_client()
        response = client.get(
            "/api/v1/auth/callback?code=abc%2B123%3D%26end",
            follow_redirects=False,
        )
        assert response.status_code == 302
        location = response.headers["location"]
        # The code should be re-encoded in the redirect URL so special
        # characters (+, =, &) don't corrupt the query string.
        assert "code=abc%2B123%3D%26end" in location

    def test_invalid_state_falls_back_to_default(self):
        client = _get_test_client()
        response = client.get(
            "/api/v1/auth/callback?code=abc123&state=not-valid-base64!!!",
            follow_redirects=False,
        )
        assert response.status_code == 302
        location = response.headers["location"]
        assert "code=abc123" in location


# ═════════════════════════════════════════════════════════════════════
# ChatGPT routes
# ═════════════════════════════════════════════════════════════════════


class TestChatGPTParseText:
    @patch("app.routes.chatgpt.call_openai_chat")
    def test_parse_text_success(self, mock_call):
        mock_call.return_value = {"success": True, "data": {"title": "Cake"}}
        client = _get_test_client()
        response = client.post(
            "/api/v1/chatgpt/parse",
            json={"text": "Mix flour and sugar"},
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    @patch("app.routes.chatgpt.call_openai_chat")
    def test_uses_default_system_prompt(self, mock_call):
        mock_call.return_value = {"success": True}
        client = _get_test_client()
        client.post("/api/v1/chatgpt/parse", json={"text": "test"})

        from app.services.recipe_service import RECIPE_SYSTEM_PROMPT

        call_kwargs = mock_call.call_args.kwargs
        assert call_kwargs["system_prompt"] == RECIPE_SYSTEM_PROMPT

    def test_missing_text_returns_422(self):
        client = _get_test_client()
        response = client.post("/api/v1/chatgpt/parse", json={})
        assert response.status_code == 422


class TestChatGPTParseUrl:
    @patch("app.routes.chatgpt.call_openai_chat")
    @patch("app.routes.chatgpt.fetch_and_extract")
    def test_parse_url_success(self, mock_fetch, mock_call):
        mock_fetch.return_value = {"ok": True, "title": "Recipe", "text": "Mix stuff"}
        mock_call.return_value = {"success": True, "data": {"title": "Recipe"}}

        client = _get_test_client()
        response = client.post(
            "/api/v1/chatgpt/parse-url",
            json={"url": "https://example.com/recipe"},
        )
        assert response.status_code == 200

    @patch("app.routes.chatgpt.fetch_and_extract")
    def test_fetch_failure_raises_http_exception(self, mock_fetch):
        mock_fetch.return_value = {
            "ok": False,
            "error": "Timed out",
            "status_code": 408,
        }
        client = _get_test_client()
        response = client.post(
            "/api/v1/chatgpt/parse-url",
            json={"url": "https://slow.example.com"},
        )
        assert response.status_code == 408

    @patch("app.routes.chatgpt.call_openai_chat")
    @patch("app.routes.chatgpt.fetch_and_extract")
    def test_text_truncated_to_12000(self, mock_fetch, mock_call):
        mock_fetch.return_value = {"ok": True, "title": "Recipe", "text": "a" * 20_000}
        mock_call.return_value = {"success": True}

        client = _get_test_client()
        client.post(
            "/api/v1/chatgpt/parse-url",
            json={"url": "https://example.com/recipe"},
        )

        call_kwargs = mock_call.call_args.kwargs
        assert len(call_kwargs["text"]) == 12_000


# ═════════════════════════════════════════════════════════════════════
# Recipe routes (auth required)
# ═════════════════════════════════════════════════════════════════════


class TestRecipeRoutes:
    @patch("app.routes.recipes.svc.get_saved_recipes")
    def test_list_recipes(self, mock_get_recipes):
        mock_get_recipes.return_value = [{"id": "1", "title": "Pasta"}]

        client = _get_test_client(override_auth=True)
        response = client.get("/api/v1/recipes")
        assert response.status_code == 200
        assert len(response.json()["recipes"]) == 1

    @patch("app.routes.recipes.svc.count_saved_recipes")
    def test_recipe_count(self, mock_count):
        mock_count.return_value = 3

        client = _get_test_client(override_auth=True)
        response = client.get("/api/v1/recipes/count")
        assert response.status_code == 200
        assert response.json()["count"] == 3

    @patch("app.routes.recipes.svc.get_saved_recipe_by_id")
    def test_get_recipe_found(self, mock_get):
        mock_get.return_value = {"id": "r1", "title": "Soup"}

        client = _get_test_client(override_auth=True)
        response = client.get("/api/v1/recipes/r1")
        assert response.status_code == 200
        assert response.json()["recipe"]["title"] == "Soup"

    @patch("app.routes.recipes.svc.get_saved_recipe_by_id")
    def test_get_recipe_not_found(self, mock_get):
        mock_get.return_value = None

        client = _get_test_client(override_auth=True)
        response = client.get("/api/v1/recipes/nonexistent")
        assert response.status_code == 404

    @patch("app.routes.recipes.svc.create_saved_recipe")
    @patch("app.routes.recipes.svc.count_saved_recipes", new_callable=AsyncMock, return_value=0)
    @patch("app.routes.recipes.is_pro", new_callable=AsyncMock, return_value=False)
    def test_save_recipe(self, _mock_pro, _mock_count, mock_create):
        mock_create.return_value = {
            "id": "new-1",
            "title": "Cake",
            "sourceUrl": None,
            "createdAt": "2025-01-01",
        }

        client = _get_test_client(override_auth=True)
        response = client.post(
            "/api/v1/recipes",
            json={
                "title": "Cake",
                "ingredients": ["flour", "sugar"],
                "steps": [{"instruction": "Mix", "ingredients": ["flour", "sugar"]}],
            },
        )
        assert response.status_code == 200
        assert response.json()["recipe"]["title"] == "Cake"

    @patch("app.routes.recipes.svc.create_saved_recipe")
    def test_save_recipe_failure(self, mock_create):
        mock_create.side_effect = RuntimeError("DB insert failed")

        client = _get_test_client(override_auth=True)
        response = client.post(
            "/api/v1/recipes",
            json={"title": "Fail"},
        )
        assert response.status_code == 500
