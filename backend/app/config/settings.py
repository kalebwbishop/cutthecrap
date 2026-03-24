from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    port: int = 8000
    environment: str = "development"
    log_level: str = "info"

    # Database
    postgres_connection_string: str = "postgresql://devuser:devpassword@localhost:5432/cutthecrap_dev"

    # Frontend
    frontend_url: str = "http://localhost:8081"

    # WorkOS
    workos_api_key: str = ""
    workos_client_id: str = ""
    workos_redirect_uri: str = "http://localhost:8000/api/v1/auth/callback"

    # ChatGPT Azure Function
    chatgpt_api_base: str = "https://deploy-box-apis-func-dev.azurewebsites.net"
    openai_api_key: str = ""

    # RevenueCat (server-side entitlement verification)
    revenuecat_api_key: str = ""

    # CORS
    cors_origin: str = "http://localhost:19006,http://localhost:19000,http://localhost:8081"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origin.split(",")]
        # In development, allow all origins so physical devices can connect
        if self.environment == "development" and "*" not in origins:
            origins.append("*")
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
