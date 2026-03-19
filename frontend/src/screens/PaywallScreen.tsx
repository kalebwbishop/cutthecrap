import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { CloseIcon } from '@/components/Icons';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getWebPurchases } from '@/config/revenuecat';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

/**
 * Paywall screen — presents the RevenueCat paywall UI.
 * On native: uses RevenueCatUI.Paywall component.
 * On web: uses purchases-js presentPaywall() to render into a DOM container.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = React.useMemo(() => createStyles(colors), [colors]);
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

  // --- Web: use purchases-js presentPaywall() ---
  if (Platform.OS === 'web') {
    return <WebPaywall onDismiss={handleDismiss} />;
  }

  // --- Native: use RevenueCatUI component ---
  return (
    <RevenueCatUI.Paywall
      onDismiss={handleDismiss}
      onRestoreCompleted={handleRestore}
    />
  );
}

/** Web-specific paywall that renders the RC paywall into a DOM element. */
function WebPaywall({ onDismiss }: { onDismiss: () => void }) {
  const colors = useThemeColors();
  const s = React.useMemo(() => createStyles(colors), [colors]);
  const containerRef = useRef<View>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshCustomerInfo = useSubscriptionStore((st) => st.refreshCustomerInfo);
  const router = useRouter();
  const paywallLaunched = useRef(false);

  useEffect(() => {
    if (paywallLaunched.current) return;
    paywallLaunched.current = true;

    (async () => {
      try {
        const purchases = getWebPurchases();
        const result = await purchases.presentPaywall({
          onBack: (closePaywall) => {
            closePaywall();
          },
        });
        // Purchase completed successfully — refresh entitlement status
        await refreshCustomerInfo();
        router.back();
      } catch (e: any) {
        // User may have cancelled or an error occurred
        if (e?.errorCode === 'UserCancelledError' || e?.errorCode === 1) {
          router.back();
        } else {
          setError(e?.message ?? 'Something went wrong');
        }
      }
    })();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.webHeader}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
            <CloseIcon size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={s.webBody}>
          <Text style={[s.webTitle, { color: colors.error }]}>Purchase Error</Text>
          <Text style={[s.webSubtitle, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity style={s.webBackButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[s.webBackText, { color: colors.text }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // The presentPaywall() call injects its own UI into the DOM.
  // Show an empty container while it loads.
  return <View ref={containerRef} style={s.container} />;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
