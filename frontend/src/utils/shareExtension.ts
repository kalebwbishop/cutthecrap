import { Platform, NativeModules } from 'react-native';

const APP_GROUP = 'group.com.cutthecrap.app';
const SHARED_URL_KEY = 'sharedUrl';

/**
 * Checks App Group UserDefaults for a URL shared via the iOS Share Extension.
 * Returns a deep-link string if found, or null. Clears the value after reading.
 */
export async function checkSharedUrl(): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;

  try {
    const SharedGroupPreferences =
      NativeModules.SharedGroupPreferences ??
      NativeModules.RNSharedGroupPreferences;

    if (!SharedGroupPreferences) return null;

    const value = await SharedGroupPreferences.getItem(
      SHARED_URL_KEY,
      APP_GROUP,
    );

    if (value) {
      // Clear the stored URL so it isn't re-processed
      await SharedGroupPreferences.setItem(SHARED_URL_KEY, '', APP_GROUP);
      return `cutthecrap://extract?url=${encodeURIComponent(value)}`;
    }
  } catch {
    // Native module not available or App Group not configured — ignore
  }

  return null;
}
