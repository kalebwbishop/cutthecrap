import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Purchases as PurchasesWeb, LogLevel as WebLogLevel } from '@revenuecat/purchases-js';

/**
 * RevenueCat configuration for Cut The Crap.
 *
 * API keys are per-platform. Replace with production keys before release.
 */
const API_KEYS = {
  apple: 'test_LzCiuDWzuzhHijTlImsadWTZHXD',
  google: 'test_LzCiuDWzuzhHijTlImsadWTZHXD',
  web: 'test_LzCiuDWzuzhHijTlImsadWTZHXD',
} as const;

/** The entitlement identifier configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'Cut The Crap Pro';

/** Product identifiers configured in the RevenueCat dashboard. */
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;

/**
 * Initialize the RevenueCat SDK. Call once at app startup.
 * Uses `@revenuecat/purchases-js` on web and `react-native-purchases` on native.
 * Optionally pass the app user ID to link purchases to your auth system.
 */
export async function configureRevenueCat(appUserID?: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (PurchasesWeb.isConfigured()) return;
    if (__DEV__) {
      PurchasesWeb.setLogLevel(WebLogLevel.Debug);
    }
    const userId = appUserID || PurchasesWeb.generateRevenueCatAnonymousAppUserId();
    PurchasesWeb.configure({ apiKey: API_KEYS.web, appUserId: userId });
    return;
  }

  const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey, appUserID: appUserID ?? undefined });
}

/** Get the configured web Purchases instance. Throws if not configured. */
export function getWebPurchases(): InstanceType<typeof PurchasesWeb> {
  return PurchasesWeb.getSharedInstance();
}
