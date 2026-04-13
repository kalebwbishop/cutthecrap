import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { billingService } from '@/services/billing';
import { purchaseWebPackage } from '@/services/billing/billingService';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';
import type { BillingPackage } from '@/services/billing';


const FEATURES = [
  'Unlimited saved recipes',
  'No ads, ever',
  'Extract from any recipe site',
  'Organized recipe collection',
];

function periodLabel(packageType: string): string {
  switch (packageType) {
    case 'monthly':
      return '/ month';
    case 'annual':
      return '/ year';
    case 'lifetime':
      return 'one-time';
    default:
      return '';
  }
}

function packageTitle(packageType: string): string {
  switch (packageType) {
    case 'monthly':
      return 'Monthly';
    case 'annual':
      return 'Yearly';
    case 'lifetime':
      return 'Lifetime';
    default:
      return 'Plan';
  }
}

export default function PaywallScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const refreshCustomerInfo = useSubscriptionStore((st) => st.refreshCustomerInfo);
  const restorePurchases = useSubscriptionStore((st) => st.restorePurchases);

  const [packages, setPackages] = useState<BillingPackage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const offering = await billingService.getOfferings();
        if (offering && offering.packages.length > 0) {
          setPackages(offering.packages);
          setSelectedId(offering.packages[0].identifier);
        } else {
          setError('No plans available right now. Please try again later.');
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load plans.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!selectedId || purchasing) return;
    setPurchasing(true);
    setError(null);
    try {
      // Map package identifier to the Stripe price ID env var name
      const priceEnvMap: Record<string, string> = {
        monthly: process.env.EXPO_PUBLIC_STRIPE_PRICE_MONTHLY ?? '',
        yearly: process.env.EXPO_PUBLIC_STRIPE_PRICE_YEARLY ?? '',
        lifetime: process.env.EXPO_PUBLIC_STRIPE_PRICE_LIFETIME ?? '',
      };
      const priceId = priceEnvMap[selectedId];
      if (!priceId) {
        setError('Plan not available. Please try again later.');
        return;
      }
      await purchaseWebPackage(priceId);
      // User is redirected to Stripe Checkout; if they return:
      await refreshCustomerInfo();
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [selectedId, purchasing, refreshCustomerInfo, router]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    setError(null);
    try {
      await restorePurchases();
      const info = await billingService.getCustomerInfo();
      if (info.isPro) {
        router.back();
      } else {
        setError('No previous purchase found.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, router]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={[s.closeButton, { backgroundColor: colors.bgSubtle }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <Text style={[s.heading, { color: colors.text }]}>Upgrade to Pro</Text>
        <Text style={[s.subheading, { color: colors.textMuted }]}>
          Get the most out of Cut The Crap
        </Text>

        {/* Features */}
        <View style={s.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature} style={s.featureRow}>
              <View style={[s.checkCircle, { backgroundColor: colors.success }]}>
                <Text style={s.checkMark}>✓</Text>
              </View>
              <Text style={[s.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Loading */}
        {loading && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.textMuted} />
          </View>
        )}

        {/* Package cards */}
        {!loading && packages.length > 0 && (
          <View style={s.packageList}>
            {packages.map((pkg) => {
              const selected = pkg.identifier === selectedId;
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    s.packageCard,
                    {
                      borderColor: selected ? colors.bgButton : colors.border,
                      backgroundColor: selected ? colors.bgSubtle : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedId(pkg.identifier)}
                  activeOpacity={0.7}
                >
                  <View style={s.packageLeft}>
                    <View
                      style={[
                        s.radio,
                        {
                          borderColor: selected ? colors.bgButton : colors.borderInput,
                        },
                      ]}
                    >
                      {selected && (
                        <View style={[s.radioFill, { backgroundColor: colors.bgButton }]} />
                      )}
                    </View>
                    <Text style={[s.packageTitle, { color: colors.text }]}>
                      {packageTitle(pkg.packageType)}
                    </Text>
                  </View>
                  <View style={s.packageRight}>
                    <Text style={[s.packagePrice, { color: colors.text }]}>
                      {pkg.priceString}
                    </Text>
                    <Text style={[s.packagePeriod, { color: colors.textMuted }]}>
                      {periodLabel(pkg.packageType)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Error */}
        {error && (
          <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* CTA */}
        {!loading && packages.length > 0 && (
          <TouchableOpacity
            style={[s.ctaButton, { backgroundColor: colors.bgButton, opacity: purchasing ? 0.6 : 1 }]}
            onPress={handlePurchase}
            disabled={purchasing || !selectedId}
            activeOpacity={0.8}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={[s.ctaText, { color: colors.background }]}>Continue</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Restore & Legal links */}
        <View style={s.footerLinks}>
          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring}
            activeOpacity={0.7}
          >
            <Text style={[s.footerLinkText, { color: colors.textMuted }]}>
              {restoring ? 'Restoring…' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
          <Text style={[s.footerSeparator, { color: colors.textMuted }]}>·</Text>
          <TouchableOpacity onPress={() => router.push('/terms')} activeOpacity={0.7}>
            <Text style={[s.footerLinkText, { color: colors.textMuted }]}>Terms</Text>
          </TouchableOpacity>
          <Text style={[s.footerSeparator, { color: colors.textMuted }]}>·</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')} activeOpacity={0.7}>
            <Text style={[s.footerLinkText, { color: colors.textMuted }]}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      width: '100%',
    },
    headerSpacer: { flex: 1 },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xxl,
      paddingBottom: 40,
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    heading: {
      fontSize: fontSizes['5xl'],
      fontWeight: '700',
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    subheading: {
      fontSize: fontSizes.lg,
      textAlign: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
      lineHeight: 22,
    },
    featureList: {
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkMark: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 16,
    },
    featureText: {
      fontSize: fontSizes.lg,
      lineHeight: 22,
    },
    centered: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    packageList: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    packageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
      borderRadius: radii.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    packageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioFill: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    packageTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '600',
    },
    packageRight: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    packagePrice: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
    },
    packagePeriod: {
      fontSize: fontSizes.sm,
    },
    errorText: {
      fontSize: fontSizes.base,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    ctaButton: {
      height: 50,
      borderRadius: radii.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    ctaText: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
    },
    footerLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    footerLinkText: {
      fontSize: fontSizes.base,
    },
    footerSeparator: {
      fontSize: fontSizes.base,
    },
  });
