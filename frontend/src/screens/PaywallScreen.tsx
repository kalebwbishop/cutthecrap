import React, { useCallback } from 'react';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export default function PaywallScreen() {
  const router = useRouter();
  const refreshCustomerInfo = useSubscriptionStore((st) => st.refreshCustomerInfo);
  const restorePurchases = useSubscriptionStore((st) => st.restorePurchases);

  const handleDismiss = useCallback(() => {
    refreshCustomerInfo();
    router.back();
  }, [refreshCustomerInfo, router]);

  const handleRestore = useCallback(async () => {
    await restorePurchases();
    await refreshCustomerInfo();
  }, [restorePurchases, refreshCustomerInfo]);

  return (
    <RevenueCatUI.Paywall
      onDismiss={handleDismiss}
      onRestoreCompleted={handleRestore}
    />
  );
}
