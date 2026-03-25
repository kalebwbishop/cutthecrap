import { Platform } from 'react-native';

/**
 * Thin wrapper around expo-haptics that degrades silently on web.
 * On web the Vibration API may work (Android browsers) but fails
 * silently on iOS Safari — which is fine.
 */

let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  // Lazy-require so the web bundle never imports native haptics code.
  Haptics = require('expo-haptics');
}

/** Light tap — use for toggles, selections. */
export function selectionFeedback() {
  Haptics?.selectionAsync();
}

/** Success feedback — use after saving a recipe. */
export function successFeedback() {
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Error feedback — use on validation failures. */
export function errorFeedback() {
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
