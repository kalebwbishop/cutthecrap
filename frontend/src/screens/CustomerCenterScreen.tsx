import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

export default function CustomerCenterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const isPro = useSubscriptionStore((st) => st.isPro);

  const handleManage = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          style={[s.closeButton, { backgroundColor: colors.bgSubtle }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Manage Subscription</Text>
        <View style={s.closeButton} />
      </View>

      <View style={s.body}>
        {isPro ? (
          <>
            <Text style={[s.statusBadge, { backgroundColor: colors.success, color: '#fff' }]}>
              Pro Active
            </Text>
            <Text style={[s.title, { color: colors.text }]}>You're a Pro member</Text>
            <Text style={[s.subtitle, { color: colors.textMuted }]}>
              Manage your subscription through the {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}.
            </Text>
            <TouchableOpacity
              style={[s.manageButton, { backgroundColor: colors.bgButton }]}
              onPress={handleManage}
              activeOpacity={0.8}
            >
              <Text style={[s.manageText, { color: colors.background }]}>
                Manage in {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[s.title, { color: colors.text }]}>No Active Subscription</Text>
            <Text style={[s.subtitle, { color: colors.textMuted }]}>
              Upgrade to Pro to unlock unlimited recipe saves.
            </Text>
            <TouchableOpacity
              style={[s.manageButton, { backgroundColor: colors.bgButton }]}
              onPress={() => router.replace('/upgrade')}
              activeOpacity={0.8}
            >
              <Text style={[s.manageText, { color: colors.background }]}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '600',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    statusBadge: {
      fontSize: fontSizes.sm,
      fontWeight: '700',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSizes['4xl'],
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: fontSizes.lg,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    manageButton: {
      height: 50,
      borderRadius: radii.lg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xxl,
      minWidth: 200,
    },
    manageText: {
      fontSize: fontSizes.lg,
      fontWeight: '700',
    },
  });
