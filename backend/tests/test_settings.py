"""Tests for app.config.settings – Settings class and CORS logic."""

import pytest

from app.config.settings import Settings


class TestCorsOrigins:
    """Tests for the cors_origins computed property."""

    def test_splits_comma_separated_origins(self):
        s = Settings(
            cors_origin="http://a.com,http://b.com,http://c.com",
            environment="production",
        )
        assert s.cors_origins == ["http://a.com", "http://b.com", "http://c.com"]

    def test_strips_whitespace(self):
        s = Settings(
            cors_origin="  http://a.com , http://b.com  ",
            environment="production",
        )
        assert s.cors_origins == ["http://a.com", "http://b.com"]

    def test_development_appends_wildcard(self):
        s = Settings(
            cors_origin="http://localhost:3000",
            environment="development",
        )
        assert "*" in s.cors_origins
        assert s.cors_origins == ["http://localhost:3000", "*"]

    def test_development_does_not_duplicate_wildcard(self):
        s = Settings(cors_origin="*,http://a.com", environment="development")
        assert s.cors_origins.count("*") == 1

    def test_production_no_wildcard(self):
        s = Settings(cors_origin="http://a.com", environment="production")
        assert "*" not in s.cors_origins

    def test_single_origin(self):
        s = Settings(cors_origin="http://only.com", environment="production")
        assert s.cors_origins == ["http://only.com"]

    def test_empty_origin_string(self):
        s = Settings(cors_origin="", environment="production")
        assert s.cors_origins == [""]


class TestSettingsDefaults:
    """Verify sensible defaults are set."""

    def test_default_port(self):
        s = Settings()
        assert s.port == 8000

    def test_default_environment(self):
        s = Settings()
        assert s.environment == "development"

    def test_default_log_level(self):
        s = Settings()
        assert s.log_level == "info"
