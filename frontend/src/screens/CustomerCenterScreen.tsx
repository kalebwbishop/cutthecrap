import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeColors } from '@/theme';
import type { ThemeColors } from '@/theme';

export default function CustomerCenterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const refreshCustomerInfo = useSubscriptionStore((st) => st.refreshCustomerInfo);

  const handleDismiss = useCallback(() => {
    refreshCustomerInfo();
    router.back();
  }, [refreshCustomerInfo, router]);

  return (
    <View style={s.container}>
      <RevenueCatUI.CustomerCenterView
        style={{ flex: 1 }}
        onDismiss={handleDismiss}
        onRestoreCompleted={() => refreshCustomerInfo()}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
