from workos import WorkOSClient
from typing import Union
import httpx
from app.config.settings import get_settings
from app.utils.logger import logger

_workos_client: Union[WorkOSClient, None] = None


def get_workos_client() -> WorkOSClient:
    """Return a singleton WorkOS client instance."""
    global _workos_client
    if _workos_client is not None:
        return _workos_client

    settings = get_settings()

    if not settings.workos_api_key:
        logger.warning(
            "⚠️  WorkOS API key not configured. Authentication endpoints will not work."
        )

    _workos_client = WorkOSClient(
        api_key=settings.workos_api_key or "not-configured",
        client_id=settings.workos_client_id,
    )

    # Disable SSL verification for local development (self-signed cert in chain)
    if settings.environment == "development":
        _workos_client._http_client._client = httpx.Client(
            base_url=str(_workos_client._http_client._client.base_url),
            timeout=_workos_client._http_client._client.timeout,
            follow_redirects=True,
            verify=False,
        )

    return _workos_client
