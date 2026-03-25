import React, { useEffect, useMemo, useState } from 'react';
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
import { ArrowUpIcon, MenuIcon } from '@/components/Icons';
import SidebarDrawer from '@/components/SidebarDrawer';
import { useRecipeStore } from '@/store/recipeStore';
import { useAuthStore } from '@/store/authStore';
import { selectionFeedback } from '@/utils/haptics';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

/**
 * Main entry screen — hero title, URL input, submit button, status footer.
 */
export default function InputScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const {
    url,
    urlError,
    isLoading,
    apiStatus,
    setUrl,
    submitUrl,
    checkHealth,
  } = useRecipeStore();

  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    selectionFeedback();
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
      ? 'Connecting to extraction API…'
      : apiStatus === 'healthy'
        ? 'Extraction API connected'
        : 'Extraction API unreachable - make sure chatgpt_api is running';

  const canSubmit = url.trim() && !isLoading && apiStatus === 'healthy';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Auth button / menu */}
        <View style={[s.topBar, user ? s.topBarLeft : s.topBarRight]}>
          {user ? (
            <TouchableOpacity
              style={s.menuButton}
              onPress={() => setSidebarOpen(true)}
              activeOpacity={0.7}
            >
              <MenuIcon size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.loginButton} onPress={login} activeOpacity={0.7}>
              <Text style={s.loginButtonText}>Log in</Text>
            </TouchableOpacity>
          )}
        </View>

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
                placeholderTextColor={colors.placeholder}
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
                  color={canSubmit ? colors.white : colors.iconDisabled}
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

      <SidebarDrawer visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    topBarLeft: {
      justifyContent: 'flex-start',
    },
    topBarRight: {
      justifyContent: 'flex-end',
    },
    menuButton: {
      padding: 8,
      borderRadius: radii.md,
    },
    loginButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: radii.md,
      backgroundColor: colors.bgButton,
    },
    loginButtonText: {
      color: colors.white,
      fontSize: fontSizes.md,
      fontWeight: '600',
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
      backgroundColor: colors.sendButtonDisabled,
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
      borderTopColor: colors.statusFooterBorder,
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
