"""
Entitlement service – manages user entitlements from the local database.

Each billing platform (Apple, Google, Stripe) projects purchase state
into the shared ``user_entitlements`` table, and this service resolves feature
access from that table.
"""

from datetime import datetime, timezone

from app.config.database import get_pool
from app.utils.logger import logger

FREE_RECIPE_LIMIT = 5

# Valid entitlement statuses (only 'active' grants access by default)
ACTIVE_STATUSES = {"active"}


async def get_user_entitlement(user_id: str, entitlement_key: str) -> dict | None:
    """Return the best entitlement row for a user/key, preferring active sources.

    If the user has the same entitlement from multiple sources (e.g. an expired
    iOS subscription and an active Stripe subscription), the *active* one wins.
    Returns ``None`` when no entitlement row exists at all.
    """
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            """
            SELECT id, user_id, entitlement_key, source, status,
                   external_ref, expires_at, metadata, updated_at
            FROM user_entitlements
            WHERE user_id = $1::uuid AND entitlement_key = $2
            ORDER BY
                CASE WHEN status = 'active' THEN 0 ELSE 1 END,
                updated_at DESC
            LIMIT 1
            """,
            user_id,
            entitlement_key,
        )
        if row is None:
            return None
        return dict(row)
    except Exception:
        logger.error(
            "Failed to query entitlement for user=%s key=%s – failing open",
            user_id,
            entitlement_key,
            exc_info=True,
        )
        # Fail-open: if DB is unreachable, don't block paying customers
        return {"status": "active", "source": "fallback"}


async def is_entitled(user_id: str, entitlement_key: str) -> bool:
    """Return ``True`` if the user holds an active entitlement."""
    ent = await get_user_entitlement(user_id, entitlement_key)
    if ent is None:
        return False
    return ent.get("status") in ACTIVE_STATUSES


async def get_all_entitlements(user_id: str) -> dict:
    """Return all entitlements for a user, keyed by entitlement_key.

    When multiple sources exist for the same key, the best (active) one is
    returned.
    """
    try:
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT DISTINCT ON (entitlement_key)
                   entitlement_key, source, status, expires_at, updated_at
            FROM user_entitlements
            WHERE user_id = $1::uuid
            ORDER BY entitlement_key,
                     CASE WHEN status = 'active' THEN 0 ELSE 1 END,
                     updated_at DESC
            """,
            user_id,
        )
        return {
            row["entitlement_key"]: {
                "status": row["status"],
                "source": row["source"],
                "expiresAt": row["expires_at"].isoformat() if row["expires_at"] else None,
            }
            for row in rows
        }
    except Exception:
        logger.error("Failed to query entitlements for user=%s", user_id, exc_info=True)
        return {}


async def upsert_entitlement(
    user_id: str,
    entitlement_key: str,
    source: str,
    status: str,
    external_ref: str | None = None,
    expires_at: datetime | None = None,
    metadata: dict | None = None,
) -> dict:
    """Insert or update an entitlement row for a user/key/source combination."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO user_entitlements
            (user_id, entitlement_key, source, status, external_ref, expires_at, metadata)
        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (user_id, entitlement_key, source)
        DO UPDATE SET
            status = EXCLUDED.status,
            external_ref = EXCLUDED.external_ref,
            expires_at = EXCLUDED.expires_at,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
        """,
        user_id,
        entitlement_key,
        source,
        status,
        external_ref,
        expires_at,
        metadata if metadata is None else __import__("json").dumps(metadata),
    )
    logger.info(
        "Upserted entitlement user=%s key=%s source=%s status=%s",
        user_id,
        entitlement_key,
        source,
        status,
    )
    return dict(row)


async def recompute_entitlements(user_id: str) -> None:
    """Recompute entitlement statuses for a user based on their transactions.

    Scans ``billing_transactions`` for the user, resolves the current status of
    each entitlement source, and upserts into ``user_entitlements``.
    """
    pool = await get_pool()

    rows = await pool.fetch(
        """
        SELECT bt.source, bt.external_transaction_id, bt.external_original_id,
               bt.external_product_id, bt.purchased_at, bt.expires_at, bt.revoked_at,
               bp.entitlement_key, bp.billing_type
        FROM billing_transactions bt
        JOIN billing_products bp
            ON bt.external_product_id = bp.external_product_id
            AND bt.source = CASE bp.platform
                WHEN 'ios' THEN 'app_store'
                WHEN 'android' THEN 'play_store'
                WHEN 'web' THEN 'stripe'
            END
        WHERE bt.user_id = $1::uuid
        ORDER BY bt.purchased_at DESC
        """,
        user_id,
    )

    # Group by (entitlement_key, source) and pick the best status
    best: dict[tuple[str, str], dict] = {}
    now = datetime.now(timezone.utc)

    for row in rows:
        key = (row["entitlement_key"], row["source"])
        status = _compute_transaction_status(row, now)
        existing = best.get(key)

        # Prefer active > grace_period > billing_retry > expired > revoked
        if existing is None or _status_priority(status) < _status_priority(existing["status"]):
            best[key] = {
                "status": status,
                "external_ref": row["external_original_id"] or row["external_transaction_id"],
                "expires_at": row["expires_at"],
            }

    for (entitlement_key, source), data in best.items():
        await upsert_entitlement(
            user_id=user_id,
            entitlement_key=entitlement_key,
            source=source,
            status=data["status"],
            external_ref=data["external_ref"],
            expires_at=data["expires_at"],
        )


def _compute_transaction_status(row: dict, now: datetime) -> str:
    """Derive entitlement status from a transaction row."""
    if row["revoked_at"] is not None:
        return "revoked"
    if row["billing_type"] == "non_consumable":
        return "active"
    # Subscription
    if row["expires_at"] is None:
        return "active"
    if row["expires_at"] > now:
        return "active"
    return "expired"


_STATUS_PRIORITY = {
    "active": 0,
    "grace_period": 1,
    "billing_retry": 2,
    "paused": 3,
    "expired": 4,
    "revoked": 5,
}


def _status_priority(status: str) -> int:
    return _STATUS_PRIORITY.get(status, 99)
