import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';

const ThemeContext = createContext<ThemeColors>(lightColors);

/**
 * Provides theme colors based on the system color scheme.
 * Wrap the app root with this provider.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>
  );
}

/** Returns the current theme colors (light or dark). */
export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext);
}

/** Returns true when the system is in dark mode. */
export function useIsDarkMode(): boolean {
  return useColorScheme() === 'dark';
}
