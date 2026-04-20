import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import apiClient from '@/api/client';
import type { BillingService, BillingCustomerInfo, BillingOffering } from './types';
import { PRO_ENTITLEMENT } from './constants';

let configured = false;
let _accessToken: string | null = null;

const IOS_PRODUCT_IDS = ['ios.pro_monthly', 'ios.pro_yearly'];
const ANDROID_PRODUCT_IDS = ['android.pro_monthly', 'android.pro_yearly'];

async function getAccessToken(): Promise<string | null> {
  if (_accessToken) return _accessToken;
  try {
    const { useAuthStore } = await import('@/store/authStore');
    return useAuthStore.getState().accessToken;
  } catch {
    return null;
  }
}

async function fetchEntitlements(): Promise<BillingCustomerInfo> {
  const token = await getAccessToken();
  if (!token) return { isPro: false, managementURL: null };

  try {
    const resp = await apiClient.get('/api/v1/me/entitlements', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const entitlements = resp.data?.entitlements ?? {};
    const pro = entitlements[PRO_ENTITLEMENT];
    return {
      isPro: pro?.status === 'active',
      managementURL: null,
    };
  } catch {
    return { isPro: false, managementURL: null };
  }
}

export const billingService: BillingService = {
  async configure(appUserId?: string) {
    if (configured) return;
    try {
      await RNIap.initConnection();
      configured = true;
    } catch (err) {
      if (__DEV__) console.warn('IAP connection failed:', err);
    }
  },

  isConfigured() {
    return configured;
  },

  async logIn(appUserId: string): Promise<BillingCustomerInfo> {
    // Store the token for API calls
    try {
      const { useAuthStore } = await import('@/store/authStore');
      _accessToken = useAuthStore.getState().accessToken;
    } catch {}
    return fetchEntitlements();
  },

  async logOut(): Promise<void> {
    _accessToken = null;
  },

  async getCustomerInfo(): Promise<BillingCustomerInfo> {
    return fetchEntitlements();
  },

  async getOfferings(): Promise<BillingOffering | null> {
    if (!configured) return null;

    try {
      const productIds = Platform.OS === 'ios' ? IOS_PRODUCT_IDS : ANDROID_PRODUCT_IDS;

      const subscriptions = await RNIap.getSubscriptions({ skus: productIds });

      const packages = subscriptions.map((sub) => ({
        identifier: sub.productId,
        productId: sub.productId,
        priceString: sub.localizedPrice ?? sub.price,
        packageType: sub.productId.includes('yearly') ? 'annual' : 'monthly',
      }));

      return { identifier: 'default', packages };
    } catch (err) {
      if (__DEV__) console.warn('Failed to fetch IAP products:', err);
      return null;
    }
  },

  async restorePurchases(): Promise<BillingCustomerInfo> {
    if (!configured) return { isPro: false, managementURL: null };

    try {
      const purchases = await RNIap.getAvailablePurchases();
      const token = await getAccessToken();
      if (token && purchases.length > 0) {
        // Sync each restored purchase to the backend
        for (const purchase of purchases) {
          try {
            await apiClient.post(
              `/api/v1/billing/${Platform.OS === 'ios' ? 'ios' : 'android'}/sync`,
              {
                transactionId: purchase.transactionId,
                productId: purchase.productId,
                transactionDate: purchase.transactionDate?.toString(),
                ...(Platform.OS === 'ios' && {
                  originalTransactionIdentifierIOS: (purchase as any).originalTransactionIdentifierIOS,
                }),
                ...(Platform.OS === 'android' && {
                  purchaseToken: (purchase as any).purchaseToken,
                }),
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );
          } catch {
            // Continue restoring other purchases
          }
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('Restore purchases failed:', err);
    }

    return fetchEntitlements();
  },

  async getManagementURL() {
    return null;
  },
};

/**
 * Purchase a product by its product ID. Native only.
 * Returns the purchase object from react-native-iap after syncing to the backend.
 */
export async function purchaseProduct(productId: string): Promise<BillingCustomerInfo> {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const purchase = await RNIap.requestSubscription({ sku: productId });

  // Sync the purchase to our backend
  await apiClient.post(
    `/api/v1/billing/${Platform.OS === 'ios' ? 'ios' : 'android'}/sync`,
    {
      transactionId: purchase.transactionId,
      productId: purchase.productId,
      transactionDate: purchase.transactionDate?.toString(),
      ...(Platform.OS === 'ios' && {
        originalTransactionIdentifierIOS: (purchase as any).originalTransactionIdentifierIOS,
      }),
      ...(Platform.OS === 'android' && {
        purchaseToken: (purchase as any).purchaseToken,
      }),
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  // Finish the transaction after backend confirms
  await RNIap.finishTransaction({ purchase, isConsumable: false });

  return fetchEntitlements();
}

/** Stub — web-only function. */
export async function purchaseWebPackage(
  _packageId: string,
  _options?: { customerEmail?: string },
): Promise<BillingCustomerInfo> {
  throw new Error('purchaseWebPackage is only available on web');
}

/** Stub — web-only function. */
export async function presentWebPaywall(
  _options: { htmlTarget?: HTMLElement; onBack?: (close: () => void) => void },
): Promise<void> {
  throw new Error('presentWebPaywall is only available on web');
}

