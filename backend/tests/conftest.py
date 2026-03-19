"""Shared fixtures for backend tests."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ── Event loop ───────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Mock settings ────────────────────────────────────────────────────


@pytest.fixture
def mock_settings():
    """Return a Settings-like object without touching .env files."""
    from app.config.settings import Settings

    return Settings(
        port=8000,
        environment="test",
        log_level="warning",
        postgres_connection_string="postgresql://test:test@localhost:5432/test",
        frontend_url="http://localhost:3000",
        workos_api_key="sk_test_key",
        workos_client_id="client_test_id",
        workos_redirect_uri="http://localhost:8000/api/v1/auth/callback",
        chatgpt_api_base="https://chatgpt.test",
        openai_api_key="sk-test-openai",
        cors_origin="http://localhost:3000,http://localhost:8081",
    )


# ── Mock DB pool ─────────────────────────────────────────────────────


class MockRecord(dict):
    """Dict subclass that supports both dict[key] and attribute access, like asyncpg.Record."""

    def __getitem__(self, key):
        return super().__getitem__(key)


def make_record(data: dict) -> MockRecord:
    return MockRecord(data)


@pytest.fixture
def mock_pool():
    """Return an AsyncMock that behaves like an asyncpg.Pool."""
    pool = AsyncMock()
    pool.fetchrow = AsyncMock(return_value=None)
    pool.fetch = AsyncMock(return_value=[])
    pool.fetchval = AsyncMock(return_value=1)
    return pool


@pytest.fixture
def patch_get_pool(mock_pool):
    """Patch get_pool() everywhere it's imported."""
    with (
        patch("app.config.database.get_pool", return_value=mock_pool),
        patch("app.services.auth_service.get_pool", return_value=mock_pool),
        patch("app.services.recipe_service.get_pool", return_value=mock_pool),
    ):
        yield mock_pool


# ── Mock WorkOS client ───────────────────────────────────────────────


@pytest.fixture
def mock_workos():
    """Return a MagicMock that mimics the WorkOS client."""
    client = MagicMock()
    client.user_management = MagicMock()
    client.user_management.get_jwks_url.return_value = "https://api.workos.com/.well-known/jwks.json"
    client.user_management.get_authorization_url.return_value = "https://auth.workos.com/authorize?..."
    client.user_management.get_logout_url.return_value = "https://auth.workos.com/logout"
    return client


# ── Sample data ──────────────────────────────────────────────────────


@pytest.fixture
def sample_user_record():
    return make_record(
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "workos_user_id": "user_01ABC",
            "email": "test@example.com",
            "name": "Test User",
            "avatar_url": None,
            "created_at": "2025-01-01 00:00:00",
            "updated_at": "2025-01-01 00:00:00",
        }
    )


@pytest.fixture
def sample_recipe_record():
    return make_record(
        {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Test Recipe",
            "description": "A test recipe",
            "source_url": "https://example.com/recipe",
            "prep_time": "10 min",
            "cook_time": "20 min",
            "cool_time": None,
            "chill_time": None,
            "rest_time": None,
            "marinate_time": None,
            "soak_time": None,
            "total_time": "30 min",
            "servings": "4",
            "ingredients": ["1 cup flour", "2 eggs"],
            "steps": [{"instruction": "Mix flour and eggs", "ingredients": ["1 cup flour", "2 eggs"]}],
            "notes": ["Serve warm"],
            "created_at": "2025-01-01 00:00:00",
        }
    )
