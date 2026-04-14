"""
Billing transaction service – records and queries verified purchase
transactions from all billing platforms.

All write operations are idempotent (upsert by source + external_transaction_id)
so that duplicate webhook deliveries or repeated client syncs are safe.
"""

from datetime import datetime

from app.config.database import get_pool
from app.utils.logger import logger


async def record_transaction(
    user_id: str,
    source: str,
    external_transaction_id: str,
    external_product_id: str,
    purchased_at: datetime,
    external_original_id: str | None = None,
    raw_payload: dict | None = None,
    environment: str = "production",
    expires_at: datetime | None = None,
    revoked_at: datetime | None = None,
) -> dict:
    """Insert or update a billing transaction.  Idempotent on (source, external_transaction_id)."""
    import json

    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO billing_transactions
            (user_id, source, external_transaction_id, external_original_id,
             external_product_id, raw_payload, environment,
             purchased_at, expires_at, revoked_at)
        VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
        ON CONFLICT (source, external_transaction_id)
        DO UPDATE SET
            external_original_id = COALESCE(EXCLUDED.external_original_id, billing_transactions.external_original_id),
            external_product_id = EXCLUDED.external_product_id,
            raw_payload = EXCLUDED.raw_payload,
            expires_at = EXCLUDED.expires_at,
            revoked_at = EXCLUDED.revoked_at,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
        """,
        user_id,
        source,
        external_transaction_id,
        external_original_id,
        external_product_id,
        json.dumps(raw_payload) if raw_payload else None,
        environment,
        purchased_at,
        expires_at,
        revoked_at,
    )
    logger.info(
        "Recorded transaction source=%s txn=%s product=%s user=%s",
        source,
        external_transaction_id,
        external_product_id,
        user_id,
    )
    return dict(row)


async def get_transactions_for_user(user_id: str) -> list[dict]:
    """Return all transactions for a user, newest first."""
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, user_id, source, external_transaction_id,
               external_original_id, external_product_id,
               environment, purchased_at, expires_at, revoked_at,
               created_at, updated_at
        FROM billing_transactions
        WHERE user_id = $1::uuid
        ORDER BY purchased_at DESC
        """,
        user_id,
    )
    return [dict(r) for r in rows]


async def mark_event_processed(provider: str, event_id: str, event_type: str) -> bool:
    """Record a webhook event as processed.  Returns True if this is new, False if duplicate."""
    pool = await get_pool()
    try:
        await pool.execute(
            """
            INSERT INTO billing_webhook_events (provider, event_id, event_type)
            VALUES ($1, $2, $3)
            """,
            provider,
            event_id,
            event_type,
        )
        return True
    except Exception:
        # unique constraint violation → already processed
        return False


async def get_entitlement_key_for_product(source: str, external_product_id: str) -> str | None:
    """Look up the internal entitlement key for a platform product ID."""
    platform_map = {"app_store": "ios", "play_store": "android", "stripe": "web"}
    platform = platform_map.get(source)
    if not platform:
        return None

    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT entitlement_key FROM billing_products
        WHERE platform = $1 AND external_product_id = $2 AND is_active = TRUE
        """,
        platform,
        external_product_id,
    )
    return row["entitlement_key"] if row else None
