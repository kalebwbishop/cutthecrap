/**
 * Shared design tokens for the Cut The Crap app.
 * Mirrors the original web CSS values.
 */
const theme = {
  colors: {
    text: '#2d2d2d',
    textDark: '#1a1a1a',
    textMuted: 'rgba(0,0,0,0.5)',
    textLight: 'rgba(0,0,0,0.45)',
    textSubtle: 'rgba(0,0,0,0.6)',
    border: 'rgba(0,0,0,0.12)',
    borderLight: 'rgba(0,0,0,0.1)',
    borderInput: 'rgba(0,0,0,0.18)',
    bgSubtle: 'rgba(0,0,0,0.04)',
    bgInput: 'rgba(0,0,0,0.08)',
    bgButton: '#2d2d2d',
    bgButtonHover: '#444',
    white: '#ffffff',
    error: '#ff6b6b',
    success: '#4caf50',
    successBg: 'rgba(76,175,80,0.08)',
    statusChecking: '#ffa726',
    statusHealthy: '#66bb6a',
    statusUnreachable: '#ef5350',

    // Gradient stop colors (used for LinearGradient)
    gradientStart: '#e8a87c',
    gradientMid1: '#d4a5c4',
    gradientMid2: '#a5b4d4',
    gradientEnd: '#89c4cd',
  },

  fonts: {
    sizeXs: 11,
    sizeSm: 12,
    sizeMd: 13,
    sizeBase: 14,
    sizeLg: 15,
    sizeXl: 16,
    size2xl: 18,
    size3xl: 24,
    size4xl: 26,
    size5xl: 28,
  },

  radii: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
};

export default theme;
