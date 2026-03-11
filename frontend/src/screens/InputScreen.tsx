import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowUpIcon } from '@/components/Icons';
import { useRecipeStore } from '@/store/recipeStore';
import { colors, fontSizes, spacing, radii } from '@/theme';

/**
 * Main entry screen — hero title, URL input, submit button, status footer.
 */
export default function InputScreen() {
  const router = useRouter();
  const {
    url,
    urlError,
    isLoading,
    apiStatus,
    setUrl,
    submitUrl,
    checkHealth,
  } = useRecipeStore();

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Check API health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Animate the "checking" pulse
  useEffect(() => {
    if (apiStatus === 'checking') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [apiStatus, pulseAnim]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    await submitUrl();
    // After submitUrl, check store state to decide navigation
    const state = useRecipeStore.getState();
    if (state.isLoading) {
      router.push('/loading');
    }
  };

  // If the store is loading (e.g. submit triggered), navigate to loading
  useEffect(() => {
    if (isLoading) {
      router.push('/loading');
    }
  }, [isLoading, router]);

  // Status dot
  const statusDotColor =
    apiStatus === 'checking'
      ? colors.statusChecking
      : apiStatus === 'healthy'
        ? colors.statusHealthy
        : colors.statusUnreachable;

  const statusLabel =
    apiStatus === 'checking'
      ? 'Connecting to API…'
      : apiStatus === 'healthy'
        ? 'API connected'
        : 'API unreachable — make sure the backend is running';

  const canSubmit = url.trim() && !isLoading && apiStatus === 'healthy';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main content */}
        <View style={s.emptyState}>
          <View style={s.inputHero}>
            <Text style={s.heroTitle}>Cut The Crap</Text>
            <Text style={s.heroSubtitle}>
              We'll strip out the life stories, ads, and pop-ups — giving you
              just the recipe.
            </Text>
          </View>

          <View style={s.inputForm}>
            <View
              style={[
                s.inputWrapper,
                urlError ? s.inputWrapperError : null,
              ]}
            >
              <TextInput
                style={s.textInput}
                placeholder="Paste a URL (e.g. https://example.com)..."
                placeholderTextColor="rgba(0,0,0,0.4)"
                value={url}
                onChangeText={setUrl}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={[s.sendButton, !canSubmit && s.sendButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.7}
              >
                <ArrowUpIcon
                  size={24}
                  color={canSubmit ? '#fff' : 'rgba(0,0,0,0.3)'}
                />
              </TouchableOpacity>
            </View>
            {urlError ? <Text style={s.urlError}>{urlError}</Text> : null}
          </View>

          <Text style={s.disclaimer}>Cut The Crap can make mistakes.</Text>
        </View>

        {/* API status footer */}
        <View style={s.statusFooter}>
          <Animated.View
            style={[
              s.statusDot,
              { backgroundColor: statusDotColor },
              apiStatus === 'checking' && { opacity: pulseAnim },
            ]}
          />
          <Text style={s.statusText}>{statusLabel}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  inputHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: fontSizes['5xl'],
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
  },
  inputForm: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.lg,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxHeight: 200,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  urlError: {
    color: colors.error,
    fontSize: fontSizes.md,
    marginTop: 6,
    paddingLeft: 4,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    color: colors.textLight,
    marginTop: 8,
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSizes.sm,
    color: colors.textLight,
  },
});
