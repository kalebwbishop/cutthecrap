import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from './Icons';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

interface NotRecipePageProps {
  title?: string;
  url?: string;
  onBack: () => void;
}

/**
 * Shown when the submitted URL doesn't contain a recipe.
 */
export default function NotRecipePage({ title, onBack }: NotRecipePageProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={s.container}>
      <Text style={s.icon}>🤷</Text>
      <Text style={s.title}>That's not a recipe!</Text>
      <Text style={s.message}>
        We checked <Text style={s.bold}>{title}</Text> and it doesn't look like
        a recipe page. Try pasting a link to an actual recipe.
      </Text>
      <TouchableOpacity style={s.button} onPress={onBack} activeOpacity={0.7}>
        <ArrowLeftIcon size={20} color={colors.text} />
        <Text style={s.buttonText}>Try another URL</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: spacing.xxl,
    },
    icon: {
      fontSize: 56,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSizes['3xl'],
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 12,
    },
    message: {
      fontSize: fontSizes.lg,
      color: colors.notRecipeMessage,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 420,
      marginBottom: 28,
    },
    bold: {
      fontWeight: '600',
      color: colors.text,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: radii.md,
      backgroundColor: colors.bgInput,
    },
    buttonText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
  });
