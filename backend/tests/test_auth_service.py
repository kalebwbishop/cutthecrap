"""Tests for app.services.auth_service – user DB operations."""

import pytest
from unittest.mock import patch

from app.services.auth_service import (
    find_user_by_workos_id,
    create_user,
    get_user_with_profile,
)
from tests.conftest import make_record


class TestFindUserByWorkosId:
    @pytest.mark.asyncio
    async def test_returns_user_dict_when_found(self, patch_get_pool, sample_user_record):
        patch_get_pool.fetchrow.return_value = sample_user_record
        result = await find_user_by_workos_id("user_01ABC")
        assert result is not None
        assert result["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, patch_get_pool):
        patch_get_pool.fetchrow.return_value = None
        result = await find_user_by_workos_id("nonexistent")
        assert result is None


class TestCreateUser:
    @pytest.mark.asyncio
    async def test_returns_created_user(self, patch_get_pool, sample_user_record):
        patch_get_pool.fetchrow.return_value = sample_user_record
        result = await create_user(
            workos_user_id="user_01ABC",
            email="test@example.com",
            name="Test User",
        )
        assert result["email"] == "test@example.com"
        assert result["workos_user_id"] == "user_01ABC"

    @pytest.mark.asyncio
    async def test_raises_on_insert_failure(self, patch_get_pool):
        patch_get_pool.fetchrow.return_value = None
        with pytest.raises(RuntimeError, match="Failed to create user"):
            await create_user(
                workos_user_id="user_01ABC",
                email="test@example.com",
                name="Test User",
            )

    @pytest.mark.asyncio
    async def test_passes_avatar_url(self, patch_get_pool, sample_user_record):
        sample_user_record["avatar_url"] = "https://example.com/avatar.png"
        patch_get_pool.fetchrow.return_value = sample_user_record
        result = await create_user(
            workos_user_id="user_01ABC",
            email="test@example.com",
            name="Test User",
            avatar_url="https://example.com/avatar.png",
        )
        assert result["avatar_url"] == "https://example.com/avatar.png"


class TestGetUserWithProfile:
    @pytest.mark.asyncio
    async def test_returns_user_with_string_id(self, patch_get_pool, sample_user_record):
        patch_get_pool.fetchrow.return_value = sample_user_record
        result = await get_user_with_profile("user_01ABC")
        assert result is not None
        assert isinstance(result["id"], str)
        assert result["id"] == "550e8400-e29b-41d4-a716-446655440000"

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, patch_get_pool):
        patch_get_pool.fetchrow.return_value = None
        result = await get_user_with_profile("nonexistent")
        assert result is None
