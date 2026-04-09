import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

const LAST_UPDATED = 'March 20, 2026';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using Cut The Crap ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.',
  },
  {
    title: '2. Description of Service',
    body: 'Cut The Crap is a recipe extraction tool that allows you to paste a URL from a recipe website and receive a simplified version of the recipe without extraneous content. The App may also allow you to save and organize extracted recipes.',
  },
  {
    title: '3. User Accounts',
    body: 'Some features require you to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate information and to update it as necessary.',
  },
  {
    title: '4. Subscriptions & Payments',
    body: 'Cut The Crap offers both free and paid tiers. Paid subscriptions are billed through your platform\'s payment provider (Apple App Store, Google Play, or Stripe for web). Subscriptions automatically renew unless cancelled before the end of the current billing period. Refunds are handled according to the policies of the respective platform.',
  },
  {
    title: '5. Acceptable Use',
    body: 'You agree not to misuse the App, including but not limited to: attempting to bypass usage limits, scraping or redistributing extracted content in bulk, reverse-engineering the App, or using the App for any unlawful purpose.',
  },
  {
    title: '6. Intellectual Property',
    body: 'The App and its original content, features, and functionality are owned by Cut The Crap and are protected by copyright and other intellectual property laws. Recipes extracted through the App remain the intellectual property of their respective authors and websites.',
  },
  {
    title: '7. Disclaimer of Warranties',
    body: 'The App is provided "as is" without warranties of any kind, express or implied. We do not guarantee that recipe extraction will be accurate, complete, or error-free. Always verify ingredients and instructions, especially for allergens and dietary restrictions.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the fullest extent permitted by law, Cut The Crap shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the updated Terms. We will make reasonable efforts to notify users of significant changes.',
  },
  {
    title: '10. Contact',
    body: 'If you have questions about these Terms, please contact us through the App or our website.',
  },
];

export default function TermsScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backButton, { backgroundColor: colors.bgSubtle }]}
          onPress={handleBack}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeftIcon size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[s.lastUpdated, { color: colors.textMuted }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[s.sectionBody, { color: colors.textSubtle }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '600',
      flex: 1,
    },
    headerSpacer: {
      width: 32,
    },
    scrollContent: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: 40,
      maxWidth: 768,
      width: '100%',
      alignSelf: 'center',
    },
    lastUpdated: {
      fontSize: fontSizes.sm,
      marginBottom: spacing.xl,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    sectionBody: {
      fontSize: fontSizes.base,
      lineHeight: 22,
    },
  });
