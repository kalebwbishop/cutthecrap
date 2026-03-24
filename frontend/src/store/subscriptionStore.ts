import { create } from 'zustand';
import { billingService } from '@/services/billing';

interface SubscriptionState {
  isPro: boolean;
  managementURL: string | null;
  isProcessing: boolean;
  error: string | null;
  refreshCustomerInfo: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPro: false,
  managementURL: null,
  isProcessing: false,
  error: null,

  refreshCustomerInfo: async () => {
    try {
      const info = await billingService.getCustomerInfo();
      set({ isPro: info.isPro, managementURL: info.managementURL });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to fetch customer info' });
    }
  },

  restorePurchases: async () => {
    set({ isProcessing: true, error: null });
    try {
      const info = await billingService.restorePurchases();
      set({
        isPro: info.isPro,
        managementURL: info.managementURL,
        isProcessing: false,
      });
    } catch (e: any) {
      set({ error: e.message ?? 'Restore failed', isProcessing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
