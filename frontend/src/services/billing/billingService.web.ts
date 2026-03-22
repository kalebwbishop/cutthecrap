import { Purchases as PurchasesWeb, LogLevel } from '@revenuecat/purchases-js';
import type { Package as RCPackage } from '@revenuecat/purchases-js';
import type { BillingService, BillingCustomerInfo, BillingOffering } from './types';
import { API_KEYS, PRO_ENTITLEMENT } from './constants';

function getInstance(): InstanceType<typeof PurchasesWeb> {
  return PurchasesWeb.getSharedInstance();
}

function mapCustomerInfo(
  info: Awaited<ReturnType<InstanceType<typeof PurchasesWeb>['getCustomerInfo']>>,
): BillingCustomerInfo {
  return {
    isPro: typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined',
    managementURL: info.managementURL ?? null,
  };
}

/** Cache of RC Package objects keyed by identifier, for use in purchaseWebPackage. */
let packageCache = new Map<string, RCPackage>();

export const billingService: BillingService = {
  async configure(appUserId?: string) {
    if (PurchasesWeb.isConfigured()) return;
    if (__DEV__) PurchasesWeb.setLogLevel(LogLevel.Debug);
    const userId =
      appUserId || PurchasesWeb.generateRevenueCatAnonymousAppUserId();
    PurchasesWeb.configure({ apiKey: API_KEYS.web, appUserId: userId });
  },

  isConfigured() {
    return PurchasesWeb.isConfigured();
  },

  async getCustomerInfo(): Promise<BillingCustomerInfo> {
    if (!PurchasesWeb.isConfigured()) return { isPro: false, managementURL: null };
    const info = await getInstance().getCustomerInfo();
    return mapCustomerInfo(info);
  },

  async getOfferings(): Promise<BillingOffering | null> {
    if (!PurchasesWeb.isConfigured()) return null;
    const offerings = await getInstance().getOfferings();
    const current = offerings.current;
    if (!current) return null;

    packageCache = new Map();
    for (const pkg of current.availablePackages) {
      packageCache.set(pkg.identifier, pkg);
    }

    return {
      identifier: current.identifier,
      packages: current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        productId: pkg.webBillingProduct.identifier,
        priceString: pkg.webBillingProduct.price.formattedPrice,
        packageType: pkg.packageType,
      })),
    };
  },

  async restorePurchases(): Promise<BillingCustomerInfo> {
    if (!PurchasesWeb.isConfigured()) return { isPro: false, managementURL: null };
    const info = await getInstance().getCustomerInfo();
    return mapCustomerInfo(info);
  },

  async getManagementURL(): Promise<string | null> {
    if (!PurchasesWeb.isConfigured()) return null;
    const info = await getInstance().getCustomerInfo();
    return info.managementURL ?? null;
  },
};

/** Purchase a specific package by identifier. Web-only. */
export async function purchaseWebPackage(
  packageId: string,
  options?: { customerEmail?: string },
): Promise<BillingCustomerInfo> {
  const rcPackage = packageCache.get(packageId);
  if (!rcPackage) throw new Error(`Package "${packageId}" not found. Fetch offerings first.`);
  const result = await getInstance().purchase({
    rcPackage,
    customerEmail: options?.customerEmail,
  });
  return mapCustomerInfo(result.customerInfo);
}

/** Launch the RevenueCat web paywall modal. Web-only. */
export async function presentWebPaywall(options: {
  htmlTarget?: HTMLElement;
  onBack?: (close: () => void) => void;
}): Promise<void> {
  await getInstance().presentPaywall({
    htmlTarget: options.htmlTarget,
    onBack: options.onBack,
  });
}
