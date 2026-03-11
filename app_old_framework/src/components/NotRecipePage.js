import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from './Icons';
import theme from '../styles/theme';

/**
 * Shown when the submitted URL doesn't contain a recipe.
 */
export default function NotRecipePage({ title, url, onBack }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🤷</Text>
      <Text style={styles.title}>That's not a recipe!</Text>
      <Text style={styles.message}>
        We checked <Text style={styles.bold}>{title}</Text> and it doesn't look
        like a recipe page. Try pasting a link to an actual recipe.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onBack} activeOpacity={0.7}>
        <ArrowLeftIcon size={20} color={theme.colors.text} />
        <Text style={styles.buttonText}>Try another URL</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.spacing.xxl,
  },
  icon: {
    fontSize: 56,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.size3xl,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 12,
  },
  message: {
    fontSize: theme.fonts.sizeLg,
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 420,
    marginBottom: 28,
  },
  bold: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.bgInput,
  },
  buttonText: {
    fontSize: theme.fonts.sizeBase,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
