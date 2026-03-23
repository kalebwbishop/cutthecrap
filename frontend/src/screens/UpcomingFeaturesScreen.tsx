import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';
import { FREE_FEATURES, PRO_FEATURES } from '@/data/upcomingFeatures';
import type { UpcomingFeature } from '@/data/upcomingFeatures';

export default function UpcomingFeaturesScreen() {
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

  const renderFeature = (feature: UpcomingFeature, index: number) => (
    <View key={index} style={s.featureCard}>
      <Text style={s.featureTitle}>{feature.title}</Text>
      <Text style={s.featureDescription}>{feature.description}</Text>
    </View>
  );

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
        <Text style={[s.headerTitle, { color: colors.text }]}>Upcoming Features</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.subtitle}>
          Here's a look at what we're working on. Have a suggestion?{' '}
          <Text style={s.feedbackLink} onPress={() => router.push('/feedback')}>
            Send us feedback!
          </Text>
        </Text>

        {/* Free tier */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionEmoji}>🆓</Text>
            <Text style={s.sectionTitle}>Free</Text>
          </View>
          <Text style={s.sectionDescription}>
            Coming to all users
          </Text>
          {FREE_FEATURES.map(renderFeature)}
        </View>

        {/* Pro tier */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionEmoji}>⭐</Text>
            <Text style={[s.sectionTitle, s.proTitle]}>Pro</Text>
          </View>
          <Text style={s.sectionDescription}>
            Exclusive to Cut The Crap Pro subscribers
          </Text>
          {PRO_FEATURES.map(renderFeature)}
        </View>
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
    subtitle: {
      fontSize: fontSizes.base,
      lineHeight: 22,
      color: colors.textMuted,
      marginBottom: spacing.xl,
    },
    feedbackLink: {
      color: colors.text,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    section: {
      marginBottom: spacing.xxl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 4,
    },
    sectionEmoji: {
      fontSize: fontSizes.xl,
    },
    sectionTitle: {
      fontSize: fontSizes['2xl'],
      fontWeight: '700',
      color: colors.text,
    },
    proTitle: {
      color: colors.success,
    },
    sectionDescription: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    featureCard: {
      backgroundColor: colors.bgSubtle,
      borderRadius: radii.md,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    featureTitle: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: fontSizes.sm,
      lineHeight: 20,
      color: colors.textMuted,
    },
  });
