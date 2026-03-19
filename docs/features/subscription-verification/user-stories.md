# Subscription Activation Verification: User Stories

> **Phase:** 1 — Stabilize and Ship Paid v1
> **Priority:** Critical

---

## Instant Pro Activation After Purchase

> **GitHub Issue:** [#11](https://github.com/kalebwbishop/cutthecrap/issues/11)

**As a** user who just purchased a Pro subscription,
**I want** Pro features to unlock immediately after I pay,
**so that** I feel confident my purchase worked and can start using what I paid for.

### Acceptance Criteria

- Pro entitlements are activated within 5 seconds of a successful purchase.
- Monthly and annual purchase flows complete successfully on iOS, Android, and web.
- RevenueCat SDK is initialized and functional on all three platforms.

---

## Cross-Platform Pro Access

> **GitHub Issue:** [#12](https://github.com/kalebwbishop/cutthecrap/issues/12)

**As a** Pro subscriber who uses multiple devices,
**I want** my Pro status to be recognized on every platform I use,
**so that** I can switch between my iPhone, Android tablet, and laptop without losing access.

### Acceptance Criteria

- Subscribing on one platform unlocks Pro on all others within one app launch.
- An entitlement refresh is triggered on app launch and on returning to foreground.
- "Restore purchases" works correctly on iOS and Android.

---

## Server-Side Entitlement Verification

> **GitHub Issue:** [#13](https://github.com/kalebwbishop/cutthecrap/issues/13)

**As a** paying Pro user,
**I want** the backend to verify my subscription status on every protected request,
**so that** my Pro access is reliable and not dependent on potentially stale client-side state.

### Acceptance Criteria

- The backend verifies entitlements server-side via RevenueCat's API or webhooks on every protected endpoint.
- Entitlement status is cached with a short TTL for performance while keeping activation responsive.
- No client-only entitlement checks are used for access control.

---

## Graceful Subscription Expiration

> **GitHub Issue:** [#14](https://github.com/kalebwbishop/cutthecrap/issues/14)

**As a** user whose Pro subscription has expired or been cancelled,
**I want** to be downgraded to the Free tier without losing my saved recipes,
**so that** I don't lose my data and can re-subscribe later if I choose.

### Acceptance Criteria

- Subscription expiration or cancellation downgrades the user to Free without data loss.
- Pro features are restricted but saved data is preserved.
- App store grace periods for failed renewals are handled correctly.
- Refund webhook events from RevenueCat revoke entitlements correctly.

---

## In-App Subscription Management

> **GitHub Issue:** [#15](https://github.com/kalebwbishop/cutthecrap/issues/15)

**As a** Pro subscriber,
**I want** to see my current plan, renewal date, and options to manage or cancel my subscription from within the app,
**so that** I have full transparency and control without leaving the app.

### Acceptance Criteria

- An in-app subscription management screen shows current plan, renewal date, and manage/cancel links.
- Links direct to the appropriate app store or web management page.
- All subscription flows are tested end-to-end in RevenueCat sandbox on each platform.
