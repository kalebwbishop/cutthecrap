# Billing / Subscription — Next Steps

This document covers what's needed to finish the RevenueCat billing integration after the shared billing service refactor.

## Architecture Overview

```
UI (screens/components)
  │  reads isPro, calls refreshCustomerInfo / restorePurchases
  ▼
subscriptionStore (Zustand)
  │  platform-agnostic — calls billingService methods
  ▼
BillingService interface (services/billing/types.ts)
  │  Metro resolves per platform at build time
  ├─► billingService.ts      → native (react-native-purchases)
  └─► billingService.web.ts  → web    (@revenuecat/purchases-js)
```

## RevenueCat Dashboard Setup

1. **Create a project** at [app.revenuecat.com](https://app.revenuecat.com) (if not already done).
2. **Add platform apps:**
   - Apple App Store app → get your Apple API key
   - Google Play app → get your Google API key
   - Web app (requires Web Billing enabled) → get your Web API key
3. **Replace test keys** in `frontend/src/services/billing/constants.ts` with production keys:
   ```ts
   export const API_KEYS = {
     apple: '<your-apple-api-key>',
     google: '<your-google-api-key>',
     web: '<your-web-api-key>',
   } as const;
   ```
4. **Create products** in RevenueCat matching the IDs in `constants.ts`:
   - `monthly` — monthly subscription
   - `yearly` — annual subscription
   - `lifetime` — one-time lifetime purchase
5. **Create an entitlement** named `Cut The Crap Pro` and attach all three products to it.
6. **Create an offering** (e.g., `default`) containing packages for the products above.

## Web Billing Setup

RevenueCat Web Billing is required for the web purchase flow.

1. **Enable Web Billing** in RevenueCat dashboard → Project Settings → Web Billing.
2. **Connect Stripe** — RevenueCat uses Stripe as the payment processor for web. Follow the [Stripe Connect setup guide](https://www.revenuecat.com/docs/web/stripe).
3. **Configure a paywall** — the web SDK uses `presentPaywall()` which renders RevenueCat's hosted paywall UI. Customize it in the dashboard under Paywalls.
4. **Test in sandbox** — use the test API keys and Stripe test mode before going live.

## App Store / Play Store Setup

1. **Apple:** Create subscriptions and in-app purchases in App Store Connect. Map them to RevenueCat products.
2. **Google:** Create subscriptions in Google Play Console. Set up [Google Real-Time Developer Notifications](https://www.revenuecat.com/docs/google-server-notifications) for RevenueCat.
3. **`react-native-purchases` works via autolinking** with EAS Build — no config plugin entry needed in `app.json`. (It does NOT have an `app.plugin.js` file.)

## Environment Variables

No `.env` changes needed — API keys live in `constants.ts`. If you prefer env vars:

```ts
// constants.ts
export const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_KEY!,
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY!,
  web: process.env.EXPO_PUBLIC_RC_WEB_KEY!,
} as const;
```

Then add to `frontend/.env`:
```
EXPO_PUBLIC_RC_APPLE_KEY=appl_xxxxx
EXPO_PUBLIC_RC_GOOGLE_KEY=goog_xxxxx
EXPO_PUBLIC_RC_WEB_KEY=rcb_xxxxx
```

## Optional Enhancements

- **Server-side receipt validation** — add a `/api/v1/subscriptions/verify` endpoint in the backend that validates receipts with RevenueCat's REST API for tamper-proof entitlement checks.
- **Webhook listener** — add a RevenueCat webhook endpoint to the backend to react to subscription events (renewal, cancellation, billing issues) and update user records.
- **Offline entitlement caching** — cache `isPro` in `expo-secure-store` so the app doesn't flash free-tier UI while refreshing on launch.
- **Custom paywall UI** — the `billingService.getOfferings()` method returns normalized package data if you want to build your own paywall instead of using RevenueCat's hosted UI.
- **Analytics** — track conversion events (paywall viewed, purchase started, purchase completed) via RevenueCat's built-in analytics or a custom integration.

## File Reference

| File | Role |
|---|---|
| `src/services/billing/types.ts` | `BillingService` interface and normalized types |
| `src/services/billing/constants.ts` | API keys, entitlement name, product IDs |
| `src/services/billing/billingService.ts` | Native implementation (iOS/Android) |
| `src/services/billing/billingService.web.ts` | Web implementation + `presentWebPaywall()` |
| `src/services/billing/index.ts` | Barrel exports |
| `src/store/subscriptionStore.ts` | Zustand store — `isPro`, `refreshCustomerInfo`, `restorePurchases` |
| `src/screens/PaywallScreen.tsx` | Native paywall (RevenueCatUI.Paywall) |
| `src/screens/PaywallScreen.web.tsx` | Web paywall (presentPaywall modal) |
| `src/screens/CustomerCenterScreen.tsx` | Native subscription management |
| `src/screens/CustomerCenterScreen.web.tsx` | Web subscription management (opens managementURL) |
