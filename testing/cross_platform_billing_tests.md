# Cross-Platform Billing — Manual Testing Guide

This document covers tests that **require a real Apple or Android device** (or simulator with sandbox accounts). These cannot be automated and must be manually verified.

---

## Prerequisites

### iOS
- Physical iPhone or iPad (or Simulator with StoreKit sandbox)
- Apple Sandbox Tester account (create in App Store Connect → Users → Sandbox Testers)
- Products configured in App Store Connect: `pro_monthly`, `pro_yearly`, `pro_lifetime`
- Backend running with `APPLE_BUNDLE_ID`, `APPLE_SHARED_SECRET` set

### Android
- Physical Android device or emulator with Google Play installed
- Google Play Console license tester account configured
- Products configured in Google Play Console: `pro_monthly`, `pro_yearly`, `pro_lifetime`
- Backend running with `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_SERVICE_ACCOUNT_JSON` set

### Backend
- PostgreSQL with billing migration applied (`npm run migrate` in `database/`)
- All billing env vars configured (see `backend/.env.example`)
- `uvicorn app.main:app --reload --port 8000` running

---

## Test 1: iOS — First-Time Purchase (Subscription)

**Steps:**
1. Sign in to the app on iOS with a test account
2. Navigate to the Paywall screen (tap "Upgrade" or try to save a 6th recipe)
3. Verify the paywall shows three plan cards: Monthly, Yearly, Lifetime
4. Select "Monthly" and tap "Subscribe"
5. Complete the Apple sandbox purchase flow (authenticate with sandbox Apple ID)
6. Wait for the purchase to complete

**Expected:**
- [ ] Paywall screen shows all 3 plans with prices from StoreKit
- [ ] Apple payment sheet appears after tapping Subscribe
- [ ] After purchase completes, paywall dismisses or shows success
- [ ] `isPro` is now `true` in the app (check Sidebar — should show Pro badge)
- [ ] Saving a 6th+ recipe succeeds (was previously blocked)
- [ ] Backend `user_entitlements` table has a row with `source='app_store'`, `status='active'`
- [ ] Backend `billing_transactions` table has a record of the purchase

---

## Test 2: iOS — Restore Purchases

**Steps:**
1. Sign in on a fresh device/reinstall with the same account that previously purchased
2. Navigate to the Paywall screen
3. Tap "Restore Purchases"

**Expected:**
- [ ] Restore completes without errors
- [ ] `isPro` becomes `true` after restore
- [ ] Backend receives the restored purchase via `/api/v1/billing/ios/sync`

---

## Test 3: iOS — Subscription Management

**Steps:**
1. With an active Pro subscription, navigate to Customer Center (Sidebar → Manage Subscription)
2. Tap "Manage in App Store"

**Expected:**
- [ ] Customer Center screen shows "Pro Active" badge and current plan info
- [ ] Tapping "Manage in App Store" opens the App Store subscription management page
- [ ] After canceling in App Store, returning to app and refreshing shows subscription will expire

---

## Test 4: iOS — Subscription Renewal (Sandbox)

**Steps:**
1. Purchase a monthly subscription in sandbox
2. Wait for sandbox auto-renewal (sandbox renews every ~5 minutes for monthly)
3. Check entitlements after renewal

**Expected:**
- [ ] Apple Server Notification arrives at `/api/v1/billing/apple/notifications`
- [ ] `user_entitlements.expires_at` is updated to new expiry
- [ ] User remains Pro without any action

---

## Test 5: iOS — Subscription Expiration

**Steps:**
1. Purchase a monthly subscription in sandbox
2. Cancel the subscription in Settings → Sandbox Account → Subscriptions
3. Wait for the subscription to expire (sandbox accelerated timeline)

**Expected:**
- [ ] Apple Server Notification for expiration arrives
- [ ] `user_entitlements.status` changes to `expired`
- [ ] `isPro` becomes `false` in the app after refresh
- [ ] Saving a 6th recipe is blocked again

---

## Test 6: iOS — Lifetime Purchase

**Steps:**
1. On the Paywall, select "Lifetime" plan
2. Complete the purchase

**Expected:**
- [ ] Purchase completes as a one-time (non-subscription) purchase
- [ ] `user_entitlements` has `status='active'` with no `expires_at` (or far-future date)
- [ ] User remains Pro indefinitely (no renewal needed)

---

## Test 7: Android — First-Time Purchase (Subscription)

**Steps:**
1. Sign in to the app on Android with a license tester account
2. Navigate to the Paywall screen
3. Select "Monthly" and tap "Subscribe"
4. Complete the Google Play purchase flow

**Expected:**
- [ ] Paywall screen shows all 3 plans with prices from Google Play
- [ ] Google Play payment sheet appears after tapping Subscribe
- [ ] After purchase completes, paywall dismisses or shows success
- [ ] `isPro` is now `true` in the app
- [ ] Backend `user_entitlements` table has `source='play_store'`, `status='active'`
- [ ] Backend `billing_transactions` table has a record with the purchase token

---

## Test 8: Android — Restore Purchases

**Steps:**
1. Sign in on a fresh device/reinstall with the same Google account
2. Navigate to the Paywall screen
3. Tap "Restore Purchases"

**Expected:**
- [ ] Restore completes without errors
- [ ] `isPro` becomes `true` after restore
- [ ] Backend receives the restored purchase via `/api/v1/billing/android/sync`

---

## Test 9: Android — Subscription Management

**Steps:**
1. With an active Pro subscription, navigate to Customer Center
2. Tap "Manage in Play Store"

**Expected:**
- [ ] Customer Center shows "Pro Active" and current plan info
- [ ] Tapping opens Google Play subscription management
- [ ] Canceling in Play Store is reflected after app refresh

---

## Test 10: Android — Subscription Renewal

**Steps:**
1. Purchase a monthly subscription with a test account
2. Wait for test renewal (Google Play test subscriptions renew on accelerated schedule)

**Expected:**
- [ ] Google RTDN notification arrives at `/api/v1/billing/google/notifications`
- [ ] Entitlement remains active with updated expiry
- [ ] User stays Pro

---

## Test 11: Android — Subscription Expiration

**Steps:**
1. Purchase and then cancel a subscription
2. Wait for expiration

**Expected:**
- [ ] RTDN notification for cancellation/expiration arrives
- [ ] `user_entitlements.status` changes to `expired`
- [ ] `isPro` becomes `false` after refresh

---

## Test 12: Android — Lifetime Purchase

**Steps:**
1. Select "Lifetime" plan on Android
2. Complete the purchase

**Expected:**
- [ ] One-time purchase completes via Google Play
- [ ] `user_entitlements` shows `status='active'` with no expiry
- [ ] User remains Pro indefinitely

---

## Test 13: Cross-Platform Entitlement Sync

**Steps:**
1. Purchase Pro on iOS (or Android)
2. Sign in to the web version with the same account
3. Check entitlements

**Expected:**
- [ ] `GET /api/v1/me/entitlements` returns `pro: { status: "active", source: "app_store" }`
- [ ] Web app shows Pro status (sidebar, recipe save works)
- [ ] The user does NOT need to re-purchase on web

---

## Test 14: Web — Stripe Checkout (for comparison)

**Steps:**
1. Sign in on web
2. Navigate to Paywall
3. Select a plan and click Subscribe
4. Complete Stripe Checkout (use test card `4242 4242 4242 4242`)

**Expected:**
- [ ] Redirected to Stripe Checkout page
- [ ] After payment, redirected back to app with `?checkout=success`
- [ ] `isPro` is `true` after Stripe webhook processes
- [ ] Entitlement source is `stripe`

---

## Test 15: Free Tier Gate Verification

**Steps:**
1. Create a new account (no purchases)
2. Save 5 recipes successfully
3. Try to save a 6th recipe

**Expected:**
- [ ] First 5 saves succeed
- [ ] 6th save shows upgrade prompt / 403 error
- [ ] After purchasing Pro, 6th+ saves work

---

## Test 16: Webhook Endpoint Verification

**Steps (can be done with CLI tools):**
1. Check Apple notification endpoint: `POST /api/v1/billing/apple/notifications`
2. Check Google RTDN endpoint: `POST /api/v1/billing/google/notifications`
3. Check Stripe webhook endpoint: `POST /api/v1/billing/stripe/webhook`

**Expected:**
- [ ] All endpoints respond (even if payload is invalid — should return 400, not 500)
- [ ] `billing_webhook_events` table records processed events
- [ ] Duplicate events are ignored (idempotent)

---

## Notes

- **Sandbox vs Production**: All mobile tests should be done in sandbox/test mode first. Sandbox purchases are free and auto-renew on accelerated schedules.
- **Webhook setup**: For Apple/Google notifications to reach your backend, you need a publicly accessible URL. Use a tunnel (ngrok, Cloudflare Tunnel) for local development.
- **Database inspection**: After each test, verify the database state:
  ```sql
  SELECT * FROM user_entitlements WHERE user_id = '<uuid>';
  SELECT * FROM billing_transactions WHERE user_id = '<uuid>' ORDER BY created_at DESC;
  SELECT * FROM billing_webhook_events ORDER BY received_at DESC LIMIT 10;
  ```
