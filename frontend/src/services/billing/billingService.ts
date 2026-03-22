import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { BillingService, BillingCustomerInfo, BillingOffering } from './types';
import { API_KEYS, PRO_ENTITLEMENT } from './constants';

let configured = false;

function mapCustomerInfo(
  info: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>,
): BillingCustomerInfo {
  return {
    isPro: typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined',
    managementURL: null,
  };
}

export const billingService: BillingService = {
  async configure(appUserId?: string) {
    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: appUserId ?? undefined });
    configured = true;
  },

  isConfigured() {
    return configured;
  },

  async getCustomerInfo(): Promise<BillingCustomerInfo> {
    if (!configured) return { isPro: false, managementURL: null };
    const info = await Purchases.getCustomerInfo();
    return mapCustomerInfo(info);
  },

  async getOfferings(): Promise<BillingOffering | null> {
    if (!configured) return null;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;
    return {
      identifier: current.identifier,
      packages: current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        productId: pkg.product.identifier,
        priceString: pkg.product.priceString,
        packageType: pkg.packageType,
      })),
    };
  },

  async restorePurchases(): Promise<BillingCustomerInfo> {
    if (!configured) return { isPro: false, managementURL: null };
    const info = await Purchases.restorePurchases();
    return mapCustomerInfo(info);
  },

  async getManagementURL() {
    return null;
  },
};

/** Stub for type-checking — real implementation lives in billingService.web.ts. */
export async function purchaseWebPackage(
  _packageId: string,
  _options?: { customerEmail?: string },
): Promise<import('./types').BillingCustomerInfo> {
  throw new Error('purchaseWebPackage is only available on web');
}

/** Stub for type-checking — real implementation lives in billingService.web.ts. */
export async function presentWebPaywall(
  _options: { htmlTarget?: HTMLElement; onBack?: (close: () => void) => void },
): Promise<void> {
  throw new Error('presentWebPaywall is only available on web');
}
