import { TextStyle } from 'react-native';

/**
 * Font-size scale and pre-built text styles for the Cut The Crap app.
 */
export const fontSizes = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 24,
  '4xl': 26,
  '5xl': 28,
} as const;

/** Pre-composed text styles for common use cases. */
export const textStyles: Record<string, TextStyle> = {
  heroTitle: {
    fontSize: fontSizes['5xl'],
    fontWeight: '600',
  },
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: '700',
    lineHeight: 32,
  },
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: '700',
  },
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
  },
  body: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: fontSizes.base,
  },
  caption: {
    fontSize: fontSizes.sm,
  },
  micro: {
    fontSize: fontSizes.xs,
  },
};

export type FontSizes = typeof fontSizes;
