import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetworkStatus } from '@/utils/useNetworkStatus';
import { useThemeColors, ThemeColors } from '@/theme';

/**
 * Renders a thin banner at the top of the screen when the device is offline.
 * Returns null when connected or while the state is being determined.
 */
export default function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isConnected !== false) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.error ?? '#d32f2f',
      paddingVertical: 6,
      alignItems: 'center',
    },
    text: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
