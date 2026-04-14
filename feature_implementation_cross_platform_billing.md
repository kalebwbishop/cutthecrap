# Cross-Platform Billing and Entitlements
## Feature Implementation Document

**Audience:** Mobile and backend developers  
**Frontend:** React Native  
**Backend:** Python API  
**Platforms:** iOS, Android, Web  
**Status:** Implementation-ready technical specification

---

## 1. Overview

This document defines the implementation for a cross-platform billing system that supports:

- **iOS** via StoreKit
- **Android** via Google Play Billing
- **Web** via Stripe
- A shared **Python entitlement service** that normalizes purchase state across all channels

The core design principle is:

> Platform billing systems are the source of truth for purchase facts. Our backend is the source of truth for feature access.

This means:

- The client can show premium UI optimistically or for convenience
- The backend must independently verify payment state
- All premium APIs are enforced through backend entitlements
- iOS, Android, and web all project into the same internal entitlement model

---

## 2. Goals

### 2.1 Functional goals

- Sell subscriptions and non-consumable premium access on iOS, Android, and web
- Unlock the same premium feature set regardless of purchase platform
- Enforce premium access on the backend for all protected endpoints
- Keep purchase state synchronized with renewals, expirations, cancellations, refunds, and billing issues
- Support restore flows and cross-device access

### 2.2 Non-goals

- Building a separate billing vendor abstraction layer beyond what is required for this feature
- Supporting consumables in the first release
- Supporting family sharing or advanced account transfer flows in the first release
- Replacing platform-native purchase UX with a custom payment UI inside native mobile apps

---

## 3. High-Level Architecture

```text
React Native App
  -> iOS StoreKit purchase flow
  -> Android Play Billing purchase flow
  -> sends purchase artifacts to Python backend

Web App
  -> Stripe Checkout / Billing flow
  -> Stripe webhooks notify Python backend

Python Backend
  -> verifies purchase state with Apple / Google / Stripe
  -> stores transactions and subscriptions
  -> projects them into a shared user_entitlements table
  -> enforces entitlements on protected APIs

Platform Event Sources
  -> Apple App Store Server Notifications V2
  -> Google Real-time Developer Notifications
  -> Stripe webhooks
```

### 3.1 Core rule

All premium feature enforcement must resolve through a shared table such as:

- `user_entitlements`

The backend should never trust:

- `isPremium` flags from the client
- local purchase caches alone
- product identifiers sent without verification

---

## 4. Shared Entitlement Model

### 4.1 Internal entitlement concept

Product IDs and platform-specific purchase objects must map to internal entitlement keys.

Example:

- `ios.pro_monthly` -> `pro`
- `ios.pro_yearly` -> `pro`
- `android.pro_monthly` -> `pro`
- `web.pro_monthly` -> `pro`

This prevents business logic from being tightly coupled to store SKU names.

### 4.2 Entitlement statuses

Recommended statuses:

- `active`
- `expired`
- `revoked`
- `grace_period`
- `billing_retry`
- `paused` (Android only if needed)

Only `active` should allow premium API access unless a specific feature explicitly supports grace states.

### 4.3 Core backend tables

#### `billing_products`

| Column | Type | Notes |
|---|---|---|
| id | UUID / PK | Internal product row |
| platform | string | `ios`, `android`, `web` |
| external_product_id | string | App Store SKU, Play SKU, or Stripe price/product mapping |
| entitlement_key | string | Example: `pro` |
| billing_type | string | `subscription`, `non_consumable` |
| is_active | bool | Internal control flag |

#### `billing_transactions`

| Column | Type | Notes |
|---|---|---|
| id | UUID / PK | Internal row |
| user_id | UUID / FK | App user |
| source | string | `app_store`, `play_store`, `stripe` |
| external_transaction_id | string | Transaction/order/payment identifier |
| external_original_id | string | Subscription lineage root where applicable |
| external_product_id | string | Purchased product |
| raw_payload | JSON / text | Original normalized payload |
| environment | string | `sandbox`, `production`, `test` |
| purchased_at | timestamp | Purchase start |
| expires_at | timestamp nullable | Subscription end |
| revoked_at | timestamp nullable | Refund/revocation |
| created_at | timestamp | Audit |
| updated_at | timestamp | Audit |

#### `user_entitlements`

| Column | Type | Notes |
|---|---|---|
| id | UUID / PK | Internal row |
| user_id | UUID / FK | App user |
| entitlement_key | string | Example: `pro` |
| source | string | `app_store`, `play_store`, `stripe` |
| status | string | `active`, `expired`, etc. |
| external_ref | string | Original transaction ID / purchase token lineage / Stripe subscription ID |
| expires_at | timestamp nullable | Relevant for subscriptions |
| metadata | JSON | Optional diagnostics |
| updated_at | timestamp | Audit |

### 4.4 Entitlement resolution rule

If a user can gain the same entitlement from multiple sources, the backend should grant the entitlement if **any valid source is active**.

Example:

- user has expired iOS subscription
- user has active web Stripe subscription
- final `pro` entitlement = `active`

---

## 5. API Contracts

### 5.1 Common API endpoints

#### `GET /v1/me/entitlements`
Returns the user’s current entitlements.

**Response example**

```json
{
  "entitlements": {
    "pro": {
      "status": "active",
      "source": "stripe",
      "expires_at": "2026-06-01T00:00:00Z"
    }
  }
}
```

#### `POST /v1/billing/ios/sync`
Receives iOS purchase data from the React Native client.

#### `POST /v1/billing/android/sync`
Receives Android purchase data from the React Native client.

#### `POST /v1/billing/web/checkout-session/attach`
Optional endpoint used to attach a completed Stripe checkout/session to the logged-in user if needed.

#### `POST /v1/billing/apple/notifications`
Apple App Store Server Notifications V2 webhook.

#### `POST /v1/billing/google/notifications`
Google Real-time Developer Notifications consumer endpoint.

#### `POST /v1/billing/stripe/webhook`
Stripe webhook endpoint.

---

## 6. iOS Implementation

### 6.1 Client implementation

Use a React Native billing bridge such as `react-native-iap` to:

- initialize connection
- fetch products/subscriptions
- launch purchase flow
- listen to purchase updates
- send purchase data to the backend
- finish transaction only after backend sync succeeds

### 6.2 Client flow

```text
User taps upgrade
  -> app requests StoreKit purchase
  -> app receives purchase update / transaction artifact
  -> app POSTs payload to /v1/billing/ios/sync
  -> backend verifies transaction and updates entitlements
  -> app refreshes entitlements from backend
  -> app finishes transaction
```

### 6.3 Payload handling

The client should send the full purchase object or the canonical signed transaction payload from the iOS bridge rather than a manually reduced subset.

Minimum data to preserve if available:

- transaction ID
- original transaction ID
- product ID
- signed transaction info / JWS if available
- environment
- app account token if used

### 6.4 Backend verification

Backend responsibilities:

- verify Apple transaction data using Apple server-side tooling
- store verified transaction details
- map product ID to internal entitlement
- compute status
- update `user_entitlements`

### 6.5 Ongoing state synchronization

Use **App Store Server Notifications V2** for:

- renewals
- expirations
- refunds / revocations
- billing issues
- grace period transitions

The notification handler must verify the signed payload, update transactions, and recompute entitlements.

### 6.6 iOS-specific notes

- Do not trust local device entitlement state as backend truth
- Finish transactions only after durable handling
- Support restore purchases by re-syncing verified transactions to backend
- Use a stable app user identifier, and if supported, include an app account token to improve linkage

---

## 7. Android Implementation

### 7.1 Client implementation

Use the Android support in `react-native-iap` for Google Play Billing.

Responsibilities:

- fetch subscriptions/products
- launch billing flow
- receive purchase updates
- send purchase token and related metadata to backend
- acknowledge/finish the purchase only after backend sync succeeds

### 7.2 Client flow

```text
User taps upgrade
  -> app requests Google Play purchase
  -> app receives purchaseToken and purchase info
  -> app POSTs payload to /v1/billing/android/sync
  -> backend verifies with Google Play Developer API
  -> backend updates transactions and entitlements
  -> app acknowledges / finishes purchase
```

### 7.3 Backend verification

Backend responsibilities:

- receive purchase token and product identifiers
- verify purchase status with Google Play Developer API
- store normalized transaction/subscription record
- map product to internal entitlement
- update `user_entitlements`

### 7.4 Ongoing state synchronization

Use **Real-time Developer Notifications (RTDN)** for:

- renewals
- cancellations
- expirations
- account hold
- grace period
- pause/resume transitions

The RTDN consumer should trigger a fresh fetch from the Google Play Developer API and then recompute entitlements.

### 7.5 Android-specific notes

- Acknowledgment is required in the normal billing lifecycle
- Do not grant permanent access from an unverified purchase token
- Android subscription states may include pause and hold semantics not present on iOS

---

## 8. Web Implementation

### 8.1 Client implementation

Use Stripe Checkout or a Stripe-hosted subscription flow for the web implementation.

Responsibilities:

- authenticated user starts checkout
- backend creates Stripe Checkout session or subscription flow
- frontend redirects to Stripe
- Stripe redirects user back on success
- backend entitlements update from Stripe webhooks

### 8.2 Web flow

```text
User clicks upgrade on web
  -> frontend calls backend to create Stripe checkout session
  -> user completes payment on Stripe
  -> Stripe sends webhook events to backend
  -> backend updates subscription and entitlements
  -> frontend fetches entitlements
```

### 8.3 Backend verification

Backend responsibilities:

- verify Stripe webhook signatures
- process relevant lifecycle events
- map Stripe price/product to internal entitlement
- upsert billing subscription state
- update `user_entitlements`

### 8.4 Relevant Stripe event types

At minimum, handle:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### 8.5 Web-specific notes

- Webhook processing should be the source of truth for activation and deactivation
- The success redirect alone should not be treated as proof of entitlement
- If using Stripe customer portal, the same webhook path should handle downstream subscription changes

---

## 9. Entitlement Projection Logic

### 9.1 Product mapping

Implement a shared mapping layer:

```python
PRODUCT_TO_ENTITLEMENT = {
    "ios.pro_monthly": "pro",
    "ios.pro_yearly": "pro",
    "android.pro_monthly": "pro",
    "android.pro_yearly": "pro",
    "stripe.price_pro_monthly": "pro",
    "stripe.price_pro_yearly": "pro",
}
```

This mapping should live in config or a database-backed billing products table.

### 9.2 Projection algorithm

For each verified billing event:

1. Normalize the external transaction/subscription into a common internal shape
2. Store or update the transaction record
3. Determine the entitlement key
4. Compute the source-specific status
5. Recompute the user’s final entitlement based on all active sources
6. Persist the result to `user_entitlements`

### 9.3 Example status logic

#### Subscription

- `revoked_at` present -> `revoked`
- active period and no billing issue -> `active`
- billing issue but still recoverable -> `billing_retry` or `grace_period`
- expired without recovery -> `expired`

#### Non-consumable

- verified purchase and not revoked -> `active`
- revoked/refunded -> `revoked`

---

## 10. Backend Enforcement

### 10.1 Rule

Every premium backend route must verify entitlements from the database.

### 10.2 Example middleware behavior

```python
from fastapi import HTTPException


def require_entitlement(user_id: str, entitlement_key: str):
    ent = get_user_entitlement(user_id, entitlement_key)
    if not ent or ent["status"] != "active":
        raise HTTPException(status_code=403, detail="Active subscription required")
```

### 10.3 Example protected endpoint

```python
@app.post("/v1/generate")
def generate(payload: dict, user=Depends(auth_user)):
    require_entitlement(user.id, "pro")
    return run_premium_generation(payload)
```

### 10.4 Important rule

The frontend may hide or show features, but only the backend can authorize premium functionality.

---

## 11. Restore and Reconciliation Flows

### 11.1 Restore behavior

The app should support restore by triggering a resync of store-owned purchases and then refreshing entitlements from the backend.

### 11.2 Repair job

Implement an internal reconciliation job for:

- missed notifications/webhooks
- support issues
- state mismatches reported by users
- backfill after deployment issues

### 11.3 Recommended repair actions

- Apple: query current transaction/subscription state and recompute entitlements
- Google: fetch current purchase/subscription state by purchase token
- Stripe: fetch current subscription state by Stripe subscription/customer ID

---

## 12. Idempotency and Reliability

### 12.1 Idempotency requirements

All sync and webhook endpoints must be idempotent.

Examples:

- duplicate Apple notification should not create duplicate entitlements
- duplicate Google notification should not create duplicate rows
- duplicate Stripe webhook should not grant access twice

### 12.2 Implementation guidance

- enforce unique constraints on external transaction IDs where appropriate
- store processed event IDs for Stripe and other event systems if available
- upsert rather than insert blindly
- ensure entitlement recomputation is deterministic

### 12.3 Retry handling

Webhook and notification handlers should be safe to retry.

The system must tolerate:

- repeated delivery
- out-of-order delivery
- temporary downstream API failures

---

## 13. Security Requirements

### 13.1 Required controls

- authenticate the user on all client-triggered sync endpoints
- verify signatures or server-side state with each payment provider
- never trust client-supplied premium flags
- protect webhook endpoints with signature verification
- log billing events for audit and debugging

### 13.2 Data handling

- store raw provider payloads for debugging where appropriate
- redact secrets from logs
- avoid exposing provider payload internals directly to clients

### 13.3 Abuse cases to prevent

- replaying stale client purchase payloads to gain access
- spoofing webhook requests
- granting entitlements before provider verification succeeds

---

## 14. Observability

### 14.1 Required metrics

Track at minimum:

- successful sync requests by platform
- failed sync requests by platform
- webhook processing success/failure by provider
- entitlement state transitions
- premium authorization denials on protected routes

### 14.2 Recommended logs

For each billing event, log:

- provider
- user ID if known
- external transaction/subscription ID
- product ID
- entitlement key
- final entitlement status
- event type
- correlation/request ID

### 14.3 Alerts

Recommended alerts:

- spike in failed Apple/Google/Stripe webhook processing
- spike in verification failures
- premium authorization denials above threshold after deployment

---

## 15. Testing Plan

### 15.1 Unit tests

Cover:

- product-to-entitlement mapping
- status computation per provider
- final entitlement merge logic
- idempotent upsert behavior
- authorization middleware

### 15.2 Integration tests

Cover:

- iOS sync endpoint with representative Apple payloads
- Android sync endpoint with representative Google payloads
- Stripe webhook processing
- entitlement activation and expiration transitions
- duplicate event delivery

### 15.3 End-to-end tests

#### iOS
- purchase succeeds and premium route unlocks
- renewal/expiration updates backend state
- restore purchases reactivates entitlement if valid

#### Android
- purchase succeeds and premium route unlocks
- acknowledgment path works correctly
- RTDN updates entitlement after subscription state changes

#### Web
- checkout completes and backend activates entitlement
- subscription cancellation eventually removes access at correct time
- failed payment transitions entitlement out of active state according to business rules

### 15.4 Manual QA checklist

- purchase on each platform
- sign in on second device and verify access
- verify expired user cannot access protected endpoint
- verify active web subscription unlocks mobile app account after backend sync
- verify duplicate webhook delivery does not duplicate state

---

## 16. Rollout Plan

### 16.1 Suggested phases

#### Phase 1: Backend foundation
- create billing tables
- implement entitlement middleware
- implement read-only entitlement endpoint

#### Phase 2: Web billing
- implement Stripe checkout and webhook processing
- activate `pro` entitlement from Stripe

#### Phase 3: iOS billing
- implement React Native iOS purchase flow
- implement Apple sync endpoint and notifications

#### Phase 4: Android billing
- implement React Native Android purchase flow
- implement Google sync endpoint and RTDN handling

#### Phase 5: Cross-platform polish
- restore flows
- reconciliation jobs
- support tooling/admin inspection

### 16.2 Feature flags

Recommended flags:

- `billing_web_enabled`
- `billing_ios_enabled`
- `billing_android_enabled`
- `premium_enforcement_enabled`

---

## 17. Open Implementation Decisions

The team should explicitly decide the following before development begins:

1. Which React Native IAP library version will be used?
2. Which Python framework is authoritative for examples and implementation: FastAPI, Django, or another?
3. What is the canonical internal entitlement key set for v1?
4. Are grace-period users allowed to retain access, or should only `active` count?
5. Will the first release include only subscriptions, or also lifetime/non-consumable products?
6. What admin/support tooling is needed to inspect billing and entitlement state?
7. Will web subscriptions be allowed to unlock mobile app access immediately for the same account?

---

## 18. Acceptance Criteria

This feature is complete when all of the following are true:

- Users can purchase premium access on iOS, Android, and web
- The backend verifies provider state before granting access
- Protected premium APIs deny access when entitlement is not active
- Entitlement changes are propagated from Apple notifications, Google RTDN, and Stripe webhooks
- Restore and resync flows work across devices
- Duplicate events do not create duplicate access grants
- Logs and metrics are sufficient to debug billing failures
- A user with an active entitlement from any supported source can access premium features across the app under the same account

---

## 19. Developer Summary

Use this implementation model:

- **iOS:** StoreKit via React Native IAP + Apple server verification + Apple notifications
- **Android:** Google Play Billing via React Native IAP + Google Play Developer API + RTDN
- **Web:** Stripe Checkout/Billing + Stripe webhooks
- **Backend:** Python entitlement projection service enforcing a shared `user_entitlements` model

The single most important rule is:

> Do not grant premium access from the client alone. Always enforce entitlements on the backend.
