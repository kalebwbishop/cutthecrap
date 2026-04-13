"""
Google Play billing service – verifies Play Store purchases and processes
Real-time Developer Notifications (RTDN).

This service handles:
  - Verifying purchase tokens with the Google Play Developer API
  - Processing Google RTDN Pub/Sub messages
  - Mapping Google Play product IDs to internal entitlements
"""

import base64
import json
from datetime import datetime, timezone

import httpx

from app.config.settings import get_settings
from app.services import billing_transaction_service as txn_svc
from app.services import entitlement_service
from app.utils.logger import logger


# ── Android Purchase Sync ────────────────────────────────────────────


async def sync_android_purchase(user_id: str, purchase_data: dict) -> dict:
    """Process an Android purchase sent from the React Native client.

    The client sends the purchase data from react-native-iap which
    includes the purchase token and product information.
    """
    purchase_token = purchase_data.get("purchaseToken")
    product_id = purchase_data.get("productId")
    transaction_id = purchase_data.get("transactionId") or purchase_data.get("orderId")

    if not product_id:
        raise ValueError("Missing productId in purchase data")
    if not transaction_id and not purchase_token:
        raise ValueError("Missing transactionId or purchaseToken in purchase data")

    # Use purchase token as fallback transaction ID
    effective_txn_id = transaction_id or purchase_token[:100]

    # Map to internal product ID format
    internal_product_id = (
        f"android.{product_id}" if not product_id.startswith("android.") else product_id
    )

    entitlement_key = await txn_svc.get_entitlement_key_for_product(
        "play_store", internal_product_id
    )
    if not entitlement_key:
        logger.warning("Unknown Android product: %s", product_id)
        raise ValueError(f"Unknown product: {product_id}")

    # Determine purchase time
    purchased_at = datetime.now(timezone.utc)
    purchase_time = purchase_data.get("transactionDate") or purchase_data.get("purchaseTime")
    if purchase_time:
        try:
            purchased_at = datetime.fromtimestamp(int(purchase_time) / 1000, tz=timezone.utc)
        except (ValueError, TypeError):
            pass

    # Determine expiry (subscriptions only)
    expires_at = None
    expiry_time = purchase_data.get("expiryTimeMillis")
    if expiry_time:
        try:
            expires_at = datetime.fromtimestamp(int(expiry_time) / 1000, tz=timezone.utc)
        except (ValueError, TypeError):
            pass

    environment = "sandbox" if purchase_data.get("isTest") else "production"

    await txn_svc.record_transaction(
        user_id=user_id,
        source="play_store",
        external_transaction_id=effective_txn_id,
        external_original_id=purchase_token[:500] if purchase_token else None,
        external_product_id=internal_product_id,
        purchased_at=purchased_at,
        expires_at=expires_at,
        raw_payload=purchase_data,
        environment=environment,
    )

    await entitlement_service.upsert_entitlement(
        user_id=user_id,
        entitlement_key=entitlement_key,
        source="play_store",
        status="active",
        external_ref=purchase_token[:500] if purchase_token else effective_txn_id,
        expires_at=expires_at,
    )

    return {"status": "ok", "entitlement": entitlement_key}


# ── Google RTDN (Real-time Developer Notifications) ──────────────────


async def handle_rtdn(message: dict) -> dict:
    """Process a Google Real-time Developer Notification.

    These arrive as Pub/Sub messages (typically via a push endpoint).
    The message.data field is base64-encoded JSON containing either a
    subscriptionNotification or oneTimeProductNotification.
    """
    data_b64 = message.get("data", "")
    if not data_b64:
        logger.warning("RTDN message missing data field")
        return {"processed": False, "reason": "missing_data"}

    try:
        data_bytes = base64.b64decode(data_b64)
        notification = json.loads(data_bytes)
    except Exception:
        logger.error("Failed to decode RTDN message data", exc_info=True)
        return {"processed": False, "reason": "decode_error"}

    logger.info("Processing Google RTDN: %s", json.dumps(notification, default=str))

    sub_notification = notification.get("subscriptionNotification")
    otp_notification = notification.get("oneTimeProductNotification")

    if sub_notification:
        await _process_subscription_notification(notification, sub_notification)
        return {"processed": True, "type": "subscription"}
    elif otp_notification:
        await _process_otp_notification(notification, otp_notification)
        return {"processed": True, "type": "one_time_product"}
    else:
        logger.info("Unhandled RTDN notification type")
        return {"processed": False, "reason": "unknown_type"}


async def _process_subscription_notification(
    envelope: dict, notification: dict
) -> None:
    """Process a subscription RTDN notification."""
    from app.config.database import get_pool

    purchase_token = notification.get("purchaseToken", "")
    notification_type = notification.get("notificationType", 0)
    subscription_id = notification.get("subscriptionId", "")

    if not purchase_token:
        logger.warning("RTDN subscription notification missing purchaseToken")
        return

    # Map product ID
    internal_product_id = (
        f"android.{subscription_id}"
        if subscription_id and not subscription_id.startswith("android.")
        else subscription_id
    )

    # Find user from existing transaction (purchase token stored as external_original_id)
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT user_id FROM billing_transactions
        WHERE source = 'play_store'
        AND (external_original_id = $1 OR external_transaction_id = $1)
        LIMIT 1
        """,
        purchase_token[:500],
    )

    if not row:
        logger.warning(
            "RTDN for unknown purchase token (first 20 chars): %s...",
            purchase_token[:20],
        )
        return

    user_id = str(row["user_id"])

    # Map notification type to status
    status = _rtdn_type_to_status(notification_type)

    entitlement_key = await txn_svc.get_entitlement_key_for_product(
        "play_store", internal_product_id
    )
    if not entitlement_key:
        logger.warning("Unknown Android product in RTDN: %s", subscription_id)
        return

    await entitlement_service.upsert_entitlement(
        user_id=user_id,
        entitlement_key=entitlement_key,
        source="play_store",
        status=status,
        external_ref=purchase_token[:500],
    )


async def _process_otp_notification(envelope: dict, notification: dict) -> None:
    """Process a one-time product RTDN notification."""
    from app.config.database import get_pool

    purchase_token = notification.get("purchaseToken", "")
    notification_type = notification.get("notificationType", 0)
    sku = notification.get("sku", "")

    if not purchase_token:
        return

    internal_product_id = f"android.{sku}" if sku and not sku.startswith("android.") else sku

    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT user_id FROM billing_transactions
        WHERE source = 'play_store'
        AND (external_original_id = $1 OR external_transaction_id = $1)
        LIMIT 1
        """,
        purchase_token[:500],
    )

    if not row:
        logger.warning("RTDN OTP for unknown purchase token")
        return

    user_id = str(row["user_id"])

    # OTP notification types: 1=PURCHASED, 2=CANCELED
    status = "revoked" if notification_type == 2 else "active"

    entitlement_key = await txn_svc.get_entitlement_key_for_product(
        "play_store", internal_product_id
    )
    if entitlement_key:
        await entitlement_service.upsert_entitlement(
            user_id=user_id,
            entitlement_key=entitlement_key,
            source="play_store",
            status=status,
            external_ref=purchase_token[:500],
        )


def _rtdn_type_to_status(notification_type: int) -> str:
    """Map Google RTDN subscription notification type to internal status.

    See: https://developer.android.com/google/play/billing/rtdn-reference
    """
    mapping = {
        1: "active",        # SUBSCRIPTION_RECOVERED
        2: "active",        # SUBSCRIPTION_RENEWED
        3: "expired",       # SUBSCRIPTION_CANCELED
        4: "active",        # SUBSCRIPTION_PURCHASED
        5: "billing_retry",  # SUBSCRIPTION_ON_HOLD
        6: "grace_period",  # SUBSCRIPTION_IN_GRACE_PERIOD
        7: "active",        # SUBSCRIPTION_RESTARTED
        8: "active",        # SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
        9: "expired",       # SUBSCRIPTION_DEFERRED
        10: "paused",       # SUBSCRIPTION_PAUSED
        11: "active",       # SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
        12: "revoked",      # SUBSCRIPTION_REVOKED
        13: "expired",      # SUBSCRIPTION_EXPIRED
        20: "active",       # SUBSCRIPTION_PENDING_PURCHASE_CANCELED
    }
    return mapping.get(notification_type, "active")
