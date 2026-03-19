# Subscription Activation Verification

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** Closed beta (April 15, 2026)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** Pro  
> **Priority:** Critical

---

## Summary

Ensure that subscription purchases through RevenueCat are correctly verified and entitlements are activated across iOS, Android, and web. Users who pay must immediately and reliably unlock Pro features on every platform they use.

---

## Value Proposition

- **For users:** Pay once, get Pro everywhere — instantly. No delays, no missing features, no need to "restore purchases" manually.
- **For the business:** Subscription activation failures directly cause refund requests, negative reviews, and support burden. Reliable entitlement verification is a prerequisite for revenue.
- **Trust:** Users who experience payment issues rarely give a second chance. First-purchase experience must be flawless.

---

## Detailed Instructions

### 1. Verify RevenueCat integration on all platforms

- Confirm that RevenueCat SDK is correctly initialized on iOS, Android, and web.
- Verify that purchase flows (monthly and annual) complete successfully and entitlements are granted in RevenueCat's dashboard.
- Test restore purchases flow on each platform.

### 2. Backend entitlement verification

- On every API request that requires Pro, the backend must verify the user's entitlement status via RevenueCat's server-side API or webhook events.
- Do not rely solely on client-side entitlement checks — the backend is the source of truth.
- Cache entitlement status with a short TTL to reduce API calls while keeping activation responsive.

### 3. Cross-platform sync

- A user who subscribes on iOS must see Pro features on Android and web immediately (within seconds of opening the app).
- Implement an entitlement refresh on app launch and on returning to foreground.

### 4. Handle edge cases

- **Grace periods:** Handle app store grace periods for failed renewals.
- **Downgrades:** When a subscription expires or is cancelled, downgrade the user to Free gracefully — do not delete data, just restrict access to Pro features.
- **Refunds:** Handle refund webhook events from RevenueCat to revoke entitlements.
- **Family sharing:** Decide whether to support app store family sharing and document the decision.

### 5. Customer center / subscription management

- Provide an in-app subscription management screen (Pro feature) that shows current plan, renewal date, and links to manage/cancel via the app store or web.
- Implement RevenueCat's Customer Center or equivalent.

---

## Acceptance Criteria

- [ ] RevenueCat SDK is initialized and functional on iOS, Android, and web.
- [ ] Monthly and annual purchase flows complete successfully on all three platforms.
- [ ] Pro entitlements are activated within 5 seconds of successful purchase.
- [ ] Backend verifies entitlements server-side on every protected endpoint — no client-only checks.
- [ ] Cross-platform sync works: subscribing on one platform unlocks Pro on all others within one app launch.
- [ ] "Restore purchases" works correctly on iOS and Android.
- [ ] Subscription expiration/cancellation downgrades to Free without data loss.
- [ ] Refund webhook events revoke entitlements correctly.
- [ ] In-app subscription management screen shows plan, renewal date, and manage/cancel links.
- [ ] All subscription flows are tested end-to-end in RevenueCat sandbox on each platform.
