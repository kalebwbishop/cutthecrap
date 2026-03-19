import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { CloseIcon } from '@/components/Icons';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getWebPurchases } from '@/config/revenuecat';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

/**
 * Customer Center screen — lets Pro users manage their subscription.
 * On native: renders RevenueCatUI.CustomerCenterView.
 * On web: opens the Web Billing management URL from customer info.
 */
export default function CustomerCenterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const refreshCustomerInfo = useSubscriptionStore((st) => st.refreshCustomerInfo);

  const handleDismiss = useCallback(() => {
    refreshCustomerInfo();
    router.back();
  }, [refreshCustomerInfo, router]);

  // Web: open management URL
  if (Platform.OS === 'web') {
    return <WebCustomerCenter onDismiss={handleDismiss} />;
  }

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

function WebCustomerCenter({ onDismiss }: { onDismiss: () => void }) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const launched = React.useRef(false);

  useEffect(() => {
    if (launched.current) return;
    launched.current = true;

    (async () => {
      try {
        const purchases = getWebPurchases();
        const info = await purchases.getCustomerInfo();
        if (info.managementURL) {
          // Open the management portal in a new tab
          if (typeof window !== 'undefined') {
            window.open(info.managementURL, '_blank', 'noopener');
          } else {
            await Linking.openURL(info.managementURL);
          }
          router.back();
        } else {
          setError('No active subscription to manage.');
          setLoading(false);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load subscription info');
        setLoading(false);
      }
    })();
  }, []);

  if (loading && !error) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.webBody}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[s.webSubtitle, { color: colors.textMuted, marginTop: spacing.md }]}>
            Opening subscription management…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.webHeader}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
          <CloseIcon size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={s.webBody}>
        <Text style={[s.webTitle, { color: colors.text }]}>Manage Subscription</Text>
        <Text style={[s.webSubtitle, { color: colors.textMuted }]}>{error}</Text>
        <TouchableOpacity style={s.webBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[s.webBackText, { color: colors.text }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    webHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    webBody: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    webTitle: {
      fontSize: fontSizes['4xl'],
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    webSubtitle: {
      fontSize: fontSizes.lg,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    webBackButton: {
      paddingVertical: 10,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    webBackText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
    },
  });
