/**
 * Shared color tokens for the Cut The Crap app.
 * Mirrors the original pastel gradient palette.
 */
export const colors = {
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
} as const;

export type Colors = typeof colors;
