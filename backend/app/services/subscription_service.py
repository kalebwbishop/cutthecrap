"""
Subscription service – checks RevenueCat for pro entitlement.

Uses the RevenueCat REST API v1 to look up a subscriber's active
entitlements.  The customer ID in RevenueCat is the user's internal
database UUID (set by the frontend via ``billingService.logIn(user.id)``).
"""

from datetime import datetime, timezone

import httpx

from app.config.settings import get_settings
from app.utils.logger import logger

PRO_ENTITLEMENT = "Cut The Crap Pro"
FREE_RECIPE_LIMIT = 5

_REVENUECAT_BASE = "https://api.revenuecat.com/v1"


async def is_pro(user_id: str) -> bool:
    """Return *True* if the user holds an active 'Cut The Crap Pro' entitlement.

    Falls back to *False* when the API key is not configured, and to *True*
    (fail-open) when the RevenueCat API is unreachable so that paying
    customers are never blocked by a third-party outage.
    """
    settings = get_settings()
    api_key = settings.revenuecat_api_key
    if not api_key:
        logger.warning("REVENUECAT_API_KEY is not configured – skipping entitlement check")
        return False

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{_REVENUECAT_BASE}/subscribers/{user_id}",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )

        if resp.status_code == 404:
            # Subscriber not found in RevenueCat – treat as free-tier
            return False

        resp.raise_for_status()
        data = resp.json()
        entitlements = data.get("subscriber", {}).get("entitlements", {})
        ent = entitlements.get(PRO_ENTITLEMENT)
        if ent is None:
            return False

        expires = ent.get("expires_date")
        if expires is None:
            # Lifetime / non-expiring entitlement
            return True

        return datetime.fromisoformat(expires.replace("Z", "+00:00")) > datetime.now(timezone.utc)

    except Exception:
        logger.error("RevenueCat API call failed – failing open", exc_info=True)
        return True
