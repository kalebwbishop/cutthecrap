"""
Stripe billing service – handles Checkout sessions, webhook processing,
and customer portal URLs.

All webhook handlers are idempotent via the ``billing_webhook_events`` table.
"""

from datetime import datetime, timezone

import stripe

from app.config.settings import get_settings
from app.services import billing_transaction_service as txn_svc
from app.services import entitlement_service
from app.utils.logger import logger


def _configure_stripe() -> None:
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key


# ── Stripe product mapping ───────────────────────────────────────────
# Maps Stripe price IDs to our internal billing product external_product_id.
# Populated lazily from settings so we don't read env at import time.

_price_map: dict[str, str] | None = None


def _get_price_map() -> dict[str, str]:
    global _price_map
    if _price_map is None:
        s = get_settings()
        _price_map = {}
        if s.stripe_price_pro_monthly:
            _price_map[s.stripe_price_pro_monthly] = "web.pro_monthly"
        if s.stripe_price_pro_yearly:
            _price_map[s.stripe_price_pro_yearly] = "web.pro_yearly"
    return _price_map


# ── Checkout ─────────────────────────────────────────────────────────


async def create_checkout_session(
    user_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    customer_email: str | None = None,
) -> dict:
    """Create a Stripe Checkout session for the given price."""
    _configure_stripe()
    settings = get_settings()

    price_map = _get_price_map()
    product_id = price_map.get(price_id)
    if not product_id:
        raise ValueError(f"Unknown Stripe price ID: {price_id}")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=customer_email,
        client_reference_id=user_id,
        metadata={"user_id": user_id, "product_id": product_id},
    )

    return {
        "sessionId": session.id,
        "url": session.url,
    }


async def create_portal_session(customer_id: str, return_url: str) -> dict:
    """Create a Stripe Customer Portal session."""
    _configure_stripe()
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return {"url": session.url}


# ── Customer lookup ──────────────────────────────────────────────────


async def get_stripe_customer_for_user(user_id: str) -> str | None:
    """Find the Stripe customer ID associated with a user from billing_transactions."""
    from app.config.database import get_pool

    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT raw_payload->'customer' AS customer_id
        FROM billing_transactions
        WHERE user_id = $1::uuid AND source = 'stripe'
        AND raw_payload ? 'customer'
        ORDER BY created_at DESC
        LIMIT 1
        """,
        user_id,
    )
    if row and row["customer_id"]:
        # JSONB returns the value with quotes, strip them
        return str(row["customer_id"]).strip('"')
    return None


# ── Webhook Processing ───────────────────────────────────────────────


async def handle_webhook(payload: bytes, sig_header: str) -> dict:
    """Verify and process a Stripe webhook event.

    Returns a dict with ``processed: bool`` and details.
    """
    _configure_stripe()
    settings = get_settings()

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.SignatureVerificationError:
        logger.warning("Stripe webhook signature verification failed")
        raise ValueError("Invalid webhook signature")

    event_type = event["type"]
    event_id = event["id"]

    # Idempotency check
    is_new = await txn_svc.mark_event_processed("stripe", event_id, event_type)
    if not is_new:
        logger.info("Stripe webhook event already processed: %s", event_id)
        return {"processed": False, "reason": "duplicate"}

    logger.info("Processing Stripe webhook: type=%s id=%s", event_type, event_id)

    handler = _WEBHOOK_HANDLERS.get(event_type)
    if handler:
        await handler(event)
        return {"processed": True, "type": event_type}

    logger.info("Unhandled Stripe event type: %s", event_type)
    return {"processed": False, "reason": "unhandled_type"}


# ── Event Handlers ───────────────────────────────────────────────────


async def _handle_checkout_completed(event: dict) -> None:
    """Handle checkout.session.completed — record transaction and activate entitlement."""
    session = event["data"]["object"]
    user_id = session.get("client_reference_id")
    if not user_id:
        logger.warning("Checkout session missing client_reference_id: %s", session.get("id"))
        return

    metadata = session.get("metadata", {})
    product_id = metadata.get("product_id")
    if not product_id:
        # Try to resolve from line items
        price_map = _get_price_map()
        # For subscription mode, the subscription is set; for payment, payment_intent
        if session.get("subscription"):
            product_id = _resolve_product_from_subscription(session["subscription"])
        else:
            logger.warning("Checkout session missing product_id metadata")
            return

    subscription_id = session.get("subscription")
    payment_intent_id = session.get("payment_intent")
    external_txn_id = subscription_id or payment_intent_id or session["id"]

    await txn_svc.record_transaction(
        user_id=user_id,
        source="stripe",
        external_transaction_id=external_txn_id,
        external_product_id=product_id,
        purchased_at=datetime.fromtimestamp(session["created"], tz=timezone.utc),
        raw_payload=session,
        environment="production",
    )

    entitlement_key = await txn_svc.get_entitlement_key_for_product("stripe", product_id)
    if entitlement_key:
        await entitlement_service.upsert_entitlement(
            user_id=user_id,
            entitlement_key=entitlement_key,
            source="stripe",
            status="active",
            external_ref=external_txn_id,
        )


async def _handle_subscription_updated(event: dict) -> None:
    """Handle customer.subscription.updated — update expiry and status."""
    sub = event["data"]["object"]
    await _sync_stripe_subscription(sub)


async def _handle_subscription_deleted(event: dict) -> None:
    """Handle customer.subscription.deleted — mark entitlement expired."""
    sub = event["data"]["object"]
    await _sync_stripe_subscription(sub, force_status="expired")


async def _handle_invoice_paid(event: dict) -> None:
    """Handle invoice.paid — renewal confirmation."""
    invoice = event["data"]["object"]
    sub_id = invoice.get("subscription")
    if not sub_id:
        return

    _configure_stripe()
    try:
        sub = stripe.Subscription.retrieve(sub_id)
        await _sync_stripe_subscription(sub)
    except Exception:
        logger.error("Failed to retrieve subscription %s after invoice.paid", sub_id, exc_info=True)


async def _handle_invoice_payment_failed(event: dict) -> None:
    """Handle invoice.payment_failed — mark billing_retry."""
    invoice = event["data"]["object"]
    sub_id = invoice.get("subscription")
    if not sub_id:
        return

    _configure_stripe()
    try:
        sub = stripe.Subscription.retrieve(sub_id)
        await _sync_stripe_subscription(sub, force_status="billing_retry")
    except Exception:
        logger.error("Failed to handle payment_failed for %s", sub_id, exc_info=True)


async def _sync_stripe_subscription(sub: dict, force_status: str | None = None) -> None:
    """Sync a Stripe subscription object into our billing tables."""
    from app.config.database import get_pool

    # Find user from metadata or existing transaction
    user_id = sub.get("metadata", {}).get("user_id")
    if not user_id:
        pool = await get_pool()
        row = await pool.fetchrow(
            """
            SELECT user_id FROM billing_transactions
            WHERE source = 'stripe' AND (external_transaction_id = $1 OR external_original_id = $1)
            LIMIT 1
            """,
            sub["id"],
        )
        if row:
            user_id = str(row["user_id"])
        else:
            logger.warning("Cannot find user for Stripe subscription %s", sub["id"])
            return

    # Resolve product
    price_map = _get_price_map()
    product_id = None
    items = sub.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
        product_id = price_map.get(price_id) if price_id else None

    if not product_id:
        logger.warning("Cannot resolve product for subscription %s", sub["id"])
        return

    # Determine status
    if force_status:
        status = force_status
    elif sub.get("status") == "active":
        status = "active"
    elif sub.get("status") == "past_due":
        status = "billing_retry"
    elif sub.get("status") in ("canceled", "unpaid"):
        status = "expired"
    elif sub.get("status") == "paused":
        status = "paused"
    else:
        status = "active"

    expires_at = None
    if sub.get("current_period_end"):
        expires_at = datetime.fromtimestamp(sub["current_period_end"], tz=timezone.utc)

    canceled_at = None
    if sub.get("canceled_at"):
        canceled_at = datetime.fromtimestamp(sub["canceled_at"], tz=timezone.utc)

    await txn_svc.record_transaction(
        user_id=user_id,
        source="stripe",
        external_transaction_id=sub["id"],
        external_product_id=product_id,
        purchased_at=datetime.fromtimestamp(sub["created"], tz=timezone.utc),
        expires_at=expires_at,
        revoked_at=canceled_at if status == "expired" else None,
        raw_payload=dict(sub),
        environment="production",
    )

    entitlement_key = await txn_svc.get_entitlement_key_for_product("stripe", product_id)
    if entitlement_key:
        await entitlement_service.upsert_entitlement(
            user_id=user_id,
            entitlement_key=entitlement_key,
            source="stripe",
            status=status,
            external_ref=sub["id"],
            expires_at=expires_at,
        )


def _resolve_product_from_subscription(sub_id: str) -> str | None:
    """Fetch a subscription and resolve the product ID."""
    try:
        sub = stripe.Subscription.retrieve(sub_id)
        items = sub.get("items", {}).get("data", [])
        if items:
            price_id = items[0].get("price", {}).get("id")
            return _get_price_map().get(price_id)
    except Exception:
        logger.error("Failed to resolve product from subscription %s", sub_id, exc_info=True)
    return None


_WEBHOOK_HANDLERS = {
    "checkout.session.completed": _handle_checkout_completed,
    "customer.subscription.created": _handle_subscription_updated,
    "customer.subscription.updated": _handle_subscription_updated,
    "customer.subscription.deleted": _handle_subscription_deleted,
    "invoice.paid": _handle_invoice_paid,
    "invoice.payment_failed": _handle_invoice_payment_failed,
}
