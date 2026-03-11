/**
 * Spacing and border-radius tokens for the Cut The Crap app.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type Radii = typeof radii;
