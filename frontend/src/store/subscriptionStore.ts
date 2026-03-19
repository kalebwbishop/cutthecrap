import { Platform } from 'react-native';
import { create } from 'zustand';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
} from 'react-native-purchases';
import { PRO_ENTITLEMENT, getWebPurchases } from '@/config/revenuecat';

interface SubscriptionState {
  /** Whether the user has an active "Cut The Crap Pro" entitlement. */
  isPro: boolean;

  /** Latest customer info from RevenueCat (native type, or simplified for web). */
  customerInfo: CustomerInfo | null;

  /** Available offerings (contains packages / products). */
  offerings: PurchasesOfferings | null;

  /** Subscription management URL (web billing). */
  managementURL: string | null;

  /** Whether a purchase or restore is in flight. */
  isProcessing: boolean;

  /** Last error message, if any. */
  error: string | null;

  /** Fetch latest customer info and refresh entitlement status. */
  refreshCustomerInfo: () => Promise<void>;

  /** Load available offerings from RevenueCat. */
  loadOfferings: () => Promise<void>;

  /** Restore purchases (e.g. after reinstall). */
  restorePurchases: () => Promise<void>;

  /** Clear error state. */
  clearError: () => void;
}

function hasProNative(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined';
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPro: false,
  customerInfo: null,
  offerings: null,
  managementURL: null,
  isProcessing: false,
  error: null,

  refreshCustomerInfo: async () => {
    try {
      if (Platform.OS === 'web') {
        const webPurchases = getWebPurchases();
        const info = await webPurchases.getCustomerInfo();
        const isPro = typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined';
        set({ isPro, managementURL: info.managementURL ?? null });
      } else {
        const info = await Purchases.getCustomerInfo();
        set({ customerInfo: info, isPro: hasProNative(info), managementURL: null });
      }
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to fetch customer info' });
    }
  },

  loadOfferings: async () => {
    try {
      if (Platform.OS === 'web') {
        // Web offerings are loaded in the paywall via presentPaywall()
        return;
      }
      const offerings = await Purchases.getOfferings();
      set({ offerings });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to load offerings' });
    }
  },

  restorePurchases: async () => {
    if (Platform.OS === 'web') return; // Not applicable on web billing
    set({ isProcessing: true, error: null });
    try {
      const info = await Purchases.restorePurchases();
      set({ customerInfo: info, isPro: hasProNative(info), isProcessing: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Restore failed', isProcessing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
