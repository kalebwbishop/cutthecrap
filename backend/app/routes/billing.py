"""
Billing routes.

Provides endpoints for billing and entitlement management:
  GET  /me/entitlements              – current user's entitlements
  POST /billing/web/create-checkout-session – create Stripe checkout
  POST /billing/web/create-portal-session   – create Stripe portal
  POST /billing/stripe/webhook       – Stripe webhook receiver
  POST /billing/ios/sync             – iOS purchase sync         (Phase 3)
  POST /billing/apple/notifications  – Apple ASSN V2 webhook     (Phase 3)
  POST /billing/android/sync         – Android purchase sync     (Phase 4)
  POST /billing/google/notifications – Google RTDN webhook       (Phase 4)
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.middleware.auth import CurrentUser, get_current_user
from app.services import entitlement_service
from app.services import stripe_service
from app.services import apple_billing_service
from app.services import google_billing_service
from app.utils.logger import logger

router = APIRouter(tags=["billing"])


# ── Entitlements ─────────────────────────────────────────────────────


@router.get("/me/entitlements")
async def get_entitlements(user: CurrentUser = Depends(get_current_user)):
    """Return the authenticated user's current entitlements."""
    entitlements = await entitlement_service.get_all_entitlements(user.id)
    return {"entitlements": entitlements}


# ── Stripe / Web Billing ─────────────────────────────────────────────


class CreateCheckoutSessionPayload(BaseModel):
    priceId: str
    successUrl: str
    cancelUrl: str


@router.post("/billing/web/create-checkout-session")
async def create_checkout_session(
    payload: CreateCheckoutSessionPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Create a Stripe Checkout session for the authenticated user."""
    try:
        result = await stripe_service.create_checkout_session(
            user_id=user.id,
            price_id=payload.priceId,
            success_url=payload.successUrl,
            cancel_url=payload.cancelUrl,
            customer_email=user.email,
        )
        return result
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception:
        logger.error("Failed to create checkout session", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Failed to create checkout session"})


@router.post("/billing/web/create-portal-session")
async def create_portal_session(
    user: CurrentUser = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for subscription management."""
    from app.config.settings import get_settings

    try:
        customer_id = await stripe_service.get_stripe_customer_for_user(user.id)
        if not customer_id:
            return JSONResponse(
                status_code=404,
                content={"error": "No active subscription found"},
            )

        settings = get_settings()
        result = await stripe_service.create_portal_session(
            customer_id=customer_id,
            return_url=settings.frontend_url,
        )
        return result
    except Exception:
        logger.error("Failed to create portal session", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Failed to create portal session"})


@router.post("/billing/stripe/webhook")
async def stripe_webhook(request: Request):
    """Receive and process Stripe webhook events."""
    body = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        result = await stripe_service.handle_webhook(body, sig)
        return result
    except ValueError:
        return JSONResponse(status_code=400, content={"error": "Invalid webhook signature"})
    except Exception:
        logger.error("Stripe webhook processing failed", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Webhook processing failed"})


# ── iOS / Apple Billing ──────────────────────────────────────────────


class IosSyncPayload(BaseModel):
    """Purchase data from react-native-iap on iOS."""
    transactionId: str | None = None
    id: str | None = None
    originalTransactionId: str | None = None
    originalTransactionIdentifierIOS: str | None = None
    productId: str
    transactionDate: str | None = None
    purchaseDate: str | None = None
    expirationDate: str | None = None
    environment: str | None = None

    class Config:
        extra = "allow"


@router.post("/billing/ios/sync")
async def ios_sync(
    payload: IosSyncPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Sync an iOS StoreKit purchase to the backend."""
    try:
        result = await apple_billing_service.sync_ios_purchase(
            user_id=user.id,
            purchase_data=payload.model_dump(),
        )
        return result
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception:
        logger.error("iOS sync failed", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "iOS purchase sync failed"})


class AppleNotificationPayload(BaseModel):
    signedPayload: str


@router.post("/billing/apple/notifications")
async def apple_notifications(payload: AppleNotificationPayload):
    """Receive App Store Server Notifications V2."""
    try:
        result = await apple_billing_service.handle_notification(payload.signedPayload)
        return result
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception:
        logger.error("Apple notification processing failed", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Notification processing failed"})


# ── Android / Google Billing ─────────────────────────────────────────


class AndroidSyncPayload(BaseModel):
    """Purchase data from react-native-iap on Android."""
    purchaseToken: str | None = None
    productId: str
    transactionId: str | None = None
    orderId: str | None = None
    transactionDate: str | None = None
    purchaseTime: str | None = None
    expiryTimeMillis: str | None = None
    isTest: bool | None = None

    class Config:
        extra = "allow"


@router.post("/billing/android/sync")
async def android_sync(
    payload: AndroidSyncPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Sync an Android Play Store purchase to the backend."""
    try:
        result = await google_billing_service.sync_android_purchase(
            user_id=user.id,
            purchase_data=payload.model_dump(),
        )
        return result
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception:
        logger.error("Android sync failed", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Android purchase sync failed"})


class GoogleRtdnPayload(BaseModel):
    """Google Pub/Sub push message wrapper."""
    message: dict
    subscription: str | None = None


@router.post("/billing/google/notifications")
async def google_notifications(payload: GoogleRtdnPayload):
    """Receive Google Play Real-time Developer Notifications (RTDN)."""
    try:
        result = await google_billing_service.handle_rtdn(payload.message)
        return result
    except Exception:
        logger.error("Google RTDN processing failed", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "RTDN processing failed"})
