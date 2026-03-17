/**
 * Shared color tokens for the Cut The Crap app.
 * Light and dark palettes for system theme support.
 */

export const lightColors = {
  background: '#f5f5f5',

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

  placeholder: 'rgba(0,0,0,0.4)',
  iconDisabled: 'rgba(0,0,0,0.3)',
  sendButtonDisabled: 'rgba(0,0,0,0.15)',
  statusFooterBorder: 'rgba(0,0,0,0.08)',
  notRecipeMessage: 'rgba(0,0,0,0.55)',
  noteItemBg: 'rgba(0,0,0,0.03)',
  noteItemBorder: 'rgba(0,0,0,0.15)',
  noteText: 'rgba(0,0,0,0.65)',
  loadingDot: '#999',
  checkboxFill: '#4caf50',
  checkboxCheck: '#ffffff',
  checkboxUnchecked: '#999',
} as const;

export const darkColors: ThemeColors = {
  background: '#121212',

  text: '#e0e0e0',
  textDark: '#f0f0f0',
  textMuted: 'rgba(255,255,255,0.5)',
  textLight: 'rgba(255,255,255,0.45)',
  textSubtle: 'rgba(255,255,255,0.6)',

  border: 'rgba(255,255,255,0.12)',
  borderLight: 'rgba(255,255,255,0.1)',
  borderInput: 'rgba(255,255,255,0.18)',

  bgSubtle: 'rgba(255,255,255,0.06)',
  bgInput: 'rgba(255,255,255,0.1)',
  bgButton: '#e0e0e0',
  bgButtonHover: '#ccc',

  white: '#1a1a1a',
  error: '#ff8a8a',
  success: '#66bb6a',
  successBg: 'rgba(76,175,80,0.15)',

  statusChecking: '#ffb74d',
  statusHealthy: '#81c784',
  statusUnreachable: '#ef5350',

  placeholder: 'rgba(255,255,255,0.4)',
  iconDisabled: 'rgba(255,255,255,0.3)',
  sendButtonDisabled: 'rgba(255,255,255,0.15)',
  statusFooterBorder: 'rgba(255,255,255,0.08)',
  notRecipeMessage: 'rgba(255,255,255,0.55)',
  noteItemBg: 'rgba(255,255,255,0.05)',
  noteItemBorder: 'rgba(255,255,255,0.15)',
  noteText: 'rgba(255,255,255,0.65)',
  loadingDot: '#888',
  checkboxFill: '#66bb6a',
  checkboxCheck: '#ffffff',
  checkboxUnchecked: '#777',
};

export type ThemeColors = { [K in keyof typeof lightColors]: string };
