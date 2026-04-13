"""
Apple billing service – verifies App Store transactions and processes
App Store Server Notifications V2.

This service handles:
  - Verifying signed transaction info (JWS) from StoreKit 2
  - Processing App Store Server Notifications V2
  - Mapping Apple product IDs to internal entitlements
"""

import base64
import json
from datetime import datetime, timezone

import httpx
import jwt as pyjwt

from app.config.settings import get_settings
from app.services import billing_transaction_service as txn_svc
from app.services import entitlement_service
from app.utils.logger import logger


# ── JWS Verification ────────────────────────────────────────────────


async def verify_and_decode_jws(signed_payload: str) -> dict:
    """Decode a JWS signed payload from Apple.

    In production, this should verify the signature against Apple's
    certificate chain.  For initial implementation, we decode the
    payload and rely on the backend being the only recipient (via
    HTTPS webhook endpoint with secret path).

    A full production implementation should:
    1. Extract the x5c certificate chain from the JWS header
    2. Verify the chain against the Apple Root CA
    3. Verify the JWS signature with the leaf certificate
    """
    try:
        # Decode without verification for now — the payload structure
        # is trusted because it arrives via our webhook endpoint.
        # TODO: Add full Apple certificate chain verification
        parts = signed_payload.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid JWS format")

        # Decode the payload (second part)
        payload_b64 = parts[1]
        # Add padding if needed
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding

        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception:
        logger.error("Failed to decode Apple JWS payload", exc_info=True)
        raise ValueError("Invalid Apple JWS payload")


# ── iOS Purchase Sync ────────────────────────────────────────────────


async def sync_ios_purchase(user_id: str, purchase_data: dict) -> dict:
    """Process an iOS purchase sent from the React Native client.

    The client sends the purchase data from react-native-iap which
    includes the transaction receipt and product information.
    """
    transaction_id = purchase_data.get("transactionId") or purchase_data.get("id")
    original_transaction_id = (
        purchase_data.get("originalTransactionId")
        or purchase_data.get("originalTransactionIdentifierIOS")
    )
    product_id = purchase_data.get("productId")

    if not transaction_id or not product_id:
        raise ValueError("Missing transactionId or productId in purchase data")

    # Map to internal product ID format
    internal_product_id = f"ios.{product_id}" if not product_id.startswith("ios.") else product_id

    entitlement_key = await txn_svc.get_entitlement_key_for_product("app_store", internal_product_id)
    if not entitlement_key:
        logger.warning("Unknown iOS product: %s", product_id)
        raise ValueError(f"Unknown product: {product_id}")

    # Determine expiry
    expires_at = None
    expires_ms = purchase_data.get("transactionDate") or purchase_data.get("expirationDate")
    if purchase_data.get("expirationDate"):
        expires_at = datetime.fromtimestamp(
            int(purchase_data["expirationDate"]) / 1000, tz=timezone.utc
        )

    purchased_at_ms = purchase_data.get("transactionDate") or purchase_data.get("purchaseDate")
    purchased_at = datetime.now(timezone.utc)
    if purchased_at_ms:
        try:
            purchased_at = datetime.fromtimestamp(int(purchased_at_ms) / 1000, tz=timezone.utc)
        except (ValueError, TypeError):
            pass

    # Determine environment
    environment = "sandbox" if purchase_data.get("environment") == "Sandbox" else "production"

    await txn_svc.record_transaction(
        user_id=user_id,
        source="app_store",
        external_transaction_id=str(transaction_id),
        external_original_id=str(original_transaction_id) if original_transaction_id else None,
        external_product_id=internal_product_id,
        purchased_at=purchased_at,
        expires_at=expires_at,
        raw_payload=purchase_data,
        environment=environment,
    )

    await entitlement_service.upsert_entitlement(
        user_id=user_id,
        entitlement_key=entitlement_key,
        source="app_store",
        status="active",
        external_ref=str(original_transaction_id or transaction_id),
        expires_at=expires_at,
    )

    return {"status": "ok", "entitlement": entitlement_key}


# ── App Store Server Notifications V2 ────────────────────────────────


async def handle_notification(signed_payload: str) -> dict:
    """Process an App Store Server Notification V2.

    The notification arrives as a JWS-signed payload containing
    transaction and renewal info.
    """
    payload = await verify_and_decode_jws(signed_payload)

    notification_type = payload.get("notificationType")
    subtype = payload.get("subtype")

    logger.info(
        "Apple notification: type=%s subtype=%s",
        notification_type,
        subtype,
    )

    # Extract transaction info from the signed payload
    data = payload.get("data", {})
    signed_transaction = data.get("signedTransactionInfo")
    signed_renewal = data.get("signedRenewalInfo")

    if signed_transaction:
        txn_info = await verify_and_decode_jws(signed_transaction)
        await _process_transaction_notification(notification_type, subtype, txn_info)

    return {"processed": True, "type": notification_type}


async def _process_transaction_notification(
    notification_type: str, subtype: str | None, txn_info: dict
) -> None:
    """Process a decoded transaction from an Apple notification."""
    from app.config.database import get_pool

    transaction_id = str(txn_info.get("transactionId", ""))
    original_transaction_id = str(txn_info.get("originalTransactionId", ""))
    product_id = txn_info.get("productId", "")
    internal_product_id = f"ios.{product_id}" if not product_id.startswith("ios.") else product_id

    # Find user from existing transaction
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT user_id FROM billing_transactions
        WHERE source = 'app_store'
        AND (external_transaction_id = $1 OR external_original_id = $1
             OR external_transaction_id = $2 OR external_original_id = $2)
        LIMIT 1
        """,
        original_transaction_id,
        transaction_id,
    )

    if not row:
        logger.warning(
            "Apple notification for unknown transaction: %s / %s",
            transaction_id,
            original_transaction_id,
        )
        return

    user_id = str(row["user_id"])

    # Parse dates
    expires_at = None
    if txn_info.get("expiresDate"):
        expires_at = datetime.fromtimestamp(txn_info["expiresDate"] / 1000, tz=timezone.utc)

    purchased_at = datetime.now(timezone.utc)
    if txn_info.get("purchaseDate"):
        purchased_at = datetime.fromtimestamp(txn_info["purchaseDate"] / 1000, tz=timezone.utc)

    revoked_at = None
    if txn_info.get("revocationDate"):
        revoked_at = datetime.fromtimestamp(txn_info["revocationDate"] / 1000, tz=timezone.utc)

    # Determine status based on notification type
    status = _notification_to_status(notification_type, subtype, txn_info)

    await txn_svc.record_transaction(
        user_id=user_id,
        source="app_store",
        external_transaction_id=transaction_id,
        external_original_id=original_transaction_id,
        external_product_id=internal_product_id,
        purchased_at=purchased_at,
        expires_at=expires_at,
        revoked_at=revoked_at,
        raw_payload=txn_info,
        environment=txn_info.get("environment", "Production").lower(),
    )

    entitlement_key = await txn_svc.get_entitlement_key_for_product("app_store", internal_product_id)
    if entitlement_key:
        await entitlement_service.upsert_entitlement(
            user_id=user_id,
            entitlement_key=entitlement_key,
            source="app_store",
            status=status,
            external_ref=original_transaction_id or transaction_id,
            expires_at=expires_at,
        )


def _notification_to_status(notification_type: str, subtype: str | None, txn_info: dict) -> str:
    """Map Apple notification type to internal entitlement status."""
    if notification_type == "REFUND":
        return "revoked"
    if notification_type == "REVOKE":
        return "revoked"
    if notification_type in ("DID_RENEW", "SUBSCRIBED", "OFFER_REDEEMED"):
        return "active"
    if notification_type == "DID_CHANGE_RENEWAL_STATUS":
        if subtype == "AUTO_RENEW_DISABLED":
            # Still active until expires_at
            return "active"
        return "active"
    if notification_type == "EXPIRED":
        return "expired"
    if notification_type == "GRACE_PERIOD_EXPIRED":
        return "expired"
    if notification_type == "DID_FAIL_TO_RENEW":
        if subtype == "GRACE_PERIOD":
            return "grace_period"
        return "billing_retry"
    if notification_type == "CONSUMPTION_REQUEST":
        return "active"
    # Default to active for unknown types
    return "active"
