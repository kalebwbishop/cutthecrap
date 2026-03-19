import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/theme';

/**
 * Handles the OAuth callback redirect.
 * The backend sends us here with ?code=<authorization_code>.
 * We exchange the code for tokens, then navigate home.
 */
export default function AuthCallback() {
  const router = useRouter();
  const colors = useThemeColors();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handleAuthCode = useAuthStore((s) => s.handleAuthCode);

  useEffect(() => {
    if (!code) {
      router.replace('/');
      return;
    }

    handleAuthCode(code).then(() => {
      router.replace('/');
    });
  }, [code, handleAuthCode, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.text} />
      <Text style={[styles.text, { color: colors.textMuted }]}>Signing in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
  },
});
