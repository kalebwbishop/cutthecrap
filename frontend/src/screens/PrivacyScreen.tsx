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
    title: '1. Information We Collect',
    body: 'We collect information you provide directly, including your email address and name when you create an account. We also collect URLs you submit for recipe extraction and recipes you choose to save. We do not collect or store the full content of third-party websites.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to: provide and maintain the App, process recipe extraction requests, store your saved recipes, manage your subscription, and improve our services. We do not sell your personal information to third parties.',
  },
  {
    title: '3. Authentication',
    body: 'We use WorkOS for authentication. When you sign in, your authentication is handled securely through their service. We store a minimal user profile (name, email, avatar URL) to identify your account.',
  },
  {
    title: '4. Data Storage',
    body: 'Your account information and saved recipes are stored in our secure database. Recipe data includes titles, ingredients, steps, and source URLs. We retain this data for as long as your account is active.',
  },
  {
    title: '5. Third-Party Services',
    body: 'The App uses the following third-party services that may collect information: WorkOS (authentication), RevenueCat (subscription management), OpenAI (recipe extraction processing), and Stripe (payment processing for web subscriptions). Each service is governed by its own privacy policy.',
  },
  {
    title: '6. Cookies & Analytics',
    body: 'The web version of the App may use essential cookies for authentication and session management. We do not use third-party tracking cookies or advertising trackers.',
  },
  {
    title: '7. Data Security',
    body: 'We implement reasonable security measures to protect your information, including encrypted connections (HTTPS), secure authentication tokens, and parameterized database queries. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '8. Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us. Deleting your account will remove your saved recipes and personal information from our systems.',
  },
  {
    title: '9. Children\'s Privacy',
    body: 'The App is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.',
  },
  {
    title: '10. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy in the App. Your continued use of the App after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '11. Contact',
    body: 'If you have questions about this Privacy Policy or your personal data, please contact us through the App or our website.',
  },
];

export default function PrivacyScreen() {
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
        >
          <ArrowLeftIcon size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
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
