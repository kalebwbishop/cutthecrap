import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@env';
import RecipeCard from './RecipeCard';
import NotRecipePage from './NotRecipePage';
import { ArrowLeftIcon, ArrowUpIcon } from './Icons';
import theme from '../styles/theme';

/**
 * Main screen — paste a recipe URL, get just the recipe.
 * Direct React Native port of the web Chat component.
 */
export default function Chat() {
  const [response, setResponse] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [notRecipe, setNotRecipe] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');

  // Typing-indicator dot animation
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Dynamic loading screen animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const messageFade = useRef(new Animated.Value(1)).current;
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const loadingMessages = [
    'Scraping the page\u2026',
    'Skipping the life story\u2026',
    'Ignoring the pop-ups\u2026',
    'Dodging the ads\u2026',
    'Finding the actual recipe\u2026',
    'Almost there\u2026',
  ];

  const apiUrl = API_URL || 'http://localhost:8000';

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

  // Check API health on mount
  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`);
        if (!cancelled) setApiStatus(res.ok ? 'healthy' : 'unreachable');
      } catch {
        if (!cancelled) setApiStatus('unreachable');
      }
    };
    checkHealth();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  // Typing indicator blink animation
  useEffect(() => {
    if (!isLoading) return;
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [isLoading, dot1, dot2, dot3]);

  // Spinning icon animation
  useEffect(() => {
    if (!isLoading) {
      spinAnim.setValue(0);
      progressAnim.setValue(0);
      setLoadingMsgIndex(0);
      return;
    }
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );
    spin.start();

    // Slow progress bar that eases toward ~90%
    const progress = Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: 20000,
      useNativeDriver: false,
    });
    progress.start();

    return () => {
      spin.stop();
      progress.stop();
    };
  }, [isLoading, spinAnim, progressAnim]);

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      Animated.timing(messageFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
        Animated.timing(messageFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading, messageFade, loadingMessages.length]);

  const isValidUrl = (text) => {
    try {
      const parsed = new URL(text);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleBack = () => {
    setResponse(null);
    setRecipe(null);
    setNotRecipe(null);
    setPageTitle('');
    setSubmitted(false);
    setSubmittedUrl('');
    setInput('');
    setUrlError('');
  };

  const fetchRecipe = useCallback(
    async (url) => {
      setUrlError('');
      setSubmitted(true);
      setSubmittedUrl(url);
      setIsLoading(true);
      Keyboard.dismiss();

      try {
        const res = await fetch(`${apiUrl}/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        if (data.title) setPageTitle(data.title);

        if (data.is_recipe === false) {
          setNotRecipe({ title: data.title, url });
          setRecipe(null);
          setResponse(null);
        } else if (data.recipe) {
          setRecipe(data.recipe);
          setResponse(null);
          setNotRecipe(null);
        } else {
          setResponse(data.summary);
          setRecipe(null);
          setNotRecipe(null);
        }
      } catch (err) {
        setResponse(`Something went wrong: ${err.message}`);
        setRecipe(null);
        setNotRecipe(null);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl],
  );

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    if (!isValidUrl(trimmed)) {
      setUrlError('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    fetchRecipe(trimmed);
  };

  // ─── Status dot color ────────────────────────────────────────
  const statusDotColor =
    apiStatus === 'checking'
      ? theme.colors.statusChecking
      : apiStatus === 'healthy'
        ? theme.colors.statusHealthy
        : theme.colors.statusUnreachable;

  const statusLabel =
    apiStatus === 'checking'
      ? 'Connecting to API…'
      : apiStatus === 'healthy'
        ? 'API connected'
        : 'API unreachable — make sure the backend is running';

  // ─── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header — shown after submit */}
        {submitted && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Cut The Crap</Text>
              {pageTitle ? (
                <Text style={styles.headerPageTitle} numberOfLines={1}>
                  — {pageTitle}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Content */}
        {!submitted ? (
          /* ── Empty / input state ── */
          <View style={styles.emptyState}>
            <View style={styles.inputHero}>
              <Text style={styles.heroTitle}>Cut The Crap</Text>
              <Text style={styles.heroSubtitle}>
                We'll strip out the life stories, ads, and pop-ups — giving you
                just the recipe.
              </Text>
            </View>

            <View style={styles.inputForm}>
              <View
                style={[
                  styles.inputWrapper,
                  urlError ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Paste a URL (e.g. https://example.com)..."
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={input}
                  onChangeText={(text) => {
                    setInput(text);
                    if (urlError) setUrlError('');
                  }}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!input.trim() || isLoading || apiStatus !== 'healthy') &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!input.trim() || isLoading || apiStatus !== 'healthy'}
                  activeOpacity={0.7}
                >
                  <ArrowUpIcon
                    size={24}
                    color={
                      !input.trim() || isLoading || apiStatus !== 'healthy'
                        ? 'rgba(0,0,0,0.3)'
                        : '#fff'
                    }
                  />
                </TouchableOpacity>
              </View>
              {urlError ? <Text style={styles.urlError}>{urlError}</Text> : null}
            </View>

            <Text style={styles.disclaimer}>Cut The Crap can make mistakes.</Text>
          </View>
        ) : isLoading ? (
          /* ── Loading ── */
          <View style={styles.loadingState}>
            {/* Spinning icon */}
            <Animated.Text
              style={[
                styles.loadingIcon,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              ✂
            </Animated.Text>

            {/* Cycling message */}
            <Animated.Text
              style={[styles.loadingMessage, { opacity: messageFade }]}
            >
              {loadingMessages[loadingMsgIndex]}
            </Animated.Text>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Bouncing dots */}
            <View style={styles.typingIndicator}>
              {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View
                  key={i}
                  style={[styles.typingDot, { opacity: dot }]}
                />
              ))}
            </View>
          </View>
        ) : (
          /* ── Result ── */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {recipe ? (
              <RecipeCard recipe={recipe} url={submittedUrl} />
            ) : notRecipe ? (
              <NotRecipePage
                title={notRecipe.title}
                url={notRecipe.url}
                onBack={handleBack}
              />
            ) : response ? (
              <View style={styles.responseContent}>
                <Text style={styles.responseText}>{response}</Text>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <ArrowLeftIcon size={20} color={theme.colors.text} />
                  <Text style={styles.tryAgainText}>Try another URL</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        )}

        {/* API status footer */}
        <View style={styles.statusFooter}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: statusDotColor },
              apiStatus === 'checking' && { opacity: pulseAnim },
            ]}
          />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 48,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    width: 34,
    height: 34,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: theme.fonts.sizeXl,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerPageTitle: {
    fontSize: theme.fonts.sizeBase,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },

  /* Empty / input state */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  inputHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: theme.fonts.size5xl,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.bgInput,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
  },
  textInput: {
    flex: 1,
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.text,
    lineHeight: 22,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxHeight: 200,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.bgButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  urlError: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizeMd,
    marginTop: 6,
    paddingLeft: 4,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: theme.fonts.sizeSm,
    color: theme.colors.textLight,
    marginTop: 8,
  },

  /* Loading */
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadingIcon: {
    fontSize: 48,
  },
  loadingMessage: {
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  progressBarTrack: {
    width: 200,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.bgInput,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },

  /* Scroll / result */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxl,
  },
  responseContent: {
    alignItems: 'center',
  },
  responseText: {
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.text,
    lineHeight: 25,
    textAlign: 'center',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.bgInput,
  },
  tryAgainText: {
    fontSize: theme.fonts.sizeBase,
    fontWeight: '600',
    color: theme.colors.text,
  },

  /* Status footer */
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
    fontSize: theme.fonts.sizeSm,
    color: theme.colors.textLight,
  },
});
