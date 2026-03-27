import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Returns `true` when the device has an active network connection,
 * `false` when offline, and `null` while the state is still being determined.
 *
 * Uses `navigator.onLine` + events on web, and a lightweight fetch probe on native.
 * No native modules required — works in Expo Go and dev client.
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setIsConnected(navigator.onLine);

      const goOnline = () => mounted && setIsConnected(true);
      const goOffline = () => mounted && setIsConnected(false);
      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);
      return () => {
        mounted = false;
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }

    // Native: probe with a lightweight HEAD request
    async function check() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3_000);
        await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mounted) setIsConnected(true);
      } catch {
        if (mounted) setIsConnected(false);
      }
    }

    check();
    const interval = setInterval(check, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}
