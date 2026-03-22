import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CloseIcon } from '@/components/Icons';
import { billingService } from '@/services/billing';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

export default function CustomerCenterScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const refreshCustomerInfo = useSubscriptionStore((st) => st.refreshCustomerInfo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const launched = React.useRef(false);

  useEffect(() => {
    if (launched.current) return;
    launched.current = true;

    (async () => {
      try {
        const url = await billingService.getManagementURL();
        if (url) {
          if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener');
          } else {
            await Linking.openURL(url);
          }
          await refreshCustomerInfo();
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
        <View style={s.body}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[s.subtitle, { color: colors.textMuted, marginTop: spacing.md }]}>
            Opening subscription management…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
          <CloseIcon size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={s.body}>
        <Text style={[s.title, { color: colors.text }]}>Manage Subscription</Text>
        <Text style={[s.subtitle, { color: colors.textMuted }]}>{error}</Text>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[s.backText, { color: colors.text }]}>Go back</Text>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    title: {
      fontSize: fontSizes['4xl'],
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: fontSizes.lg,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    backButton: {
      paddingVertical: 10,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
    },
  });
