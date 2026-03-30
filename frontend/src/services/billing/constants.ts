/** RevenueCat API keys loaded from environment variables. */
export const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_KEY ?? '',
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY ?? '',
  web: process.env.EXPO_PUBLIC_RC_WEB_KEY ?? '',
} as const;

export const PRO_ENTITLEMENT = 'Cut The Crap Pro';

export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;
