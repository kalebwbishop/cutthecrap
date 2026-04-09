import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { feedbackApi } from '@/api/feedbackApi';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

const MAX_LENGTH = 5000;

export default function FeedbackScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await feedbackApi.sendFeedback(message.trim());
      setSent(true);
    } catch {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backButton, { backgroundColor: colors.bgSubtle }]}
          onPress={handleBack}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeftIcon size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Send Feedback</Text>
        <View style={s.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sent ? (
            <View style={s.sentContainer}>
              <Text style={[s.sentEmoji]}>🎉</Text>
              <Text style={[s.sentTitle, { color: colors.text }]}>Thanks for your feedback!</Text>
              <Text style={[s.sentBody, { color: colors.textMuted }]}>
                We appreciate you taking the time to help us improve.
              </Text>
              <TouchableOpacity
                style={[s.submitButton, { backgroundColor: colors.bgButton }]}
                onPress={handleBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Text style={s.submitText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[s.label, { color: colors.textMuted }]}>
                Have a bug to report, a feature to request, or just want to say hi? We'd love to
                hear from you.
              </Text>

              <TextInput
                style={[
                  s.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.bgSubtle,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Type your feedback here…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MAX_LENGTH}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
                editable={!sending}
                accessibilityLabel="Feedback message"
                accessibilityHint="Type your feedback here"
              />

              <Text style={[s.charCount, { color: colors.textMuted }]}>
                {message.length}/{MAX_LENGTH}
              </Text>

              {error ? <Text style={[s.errorText, { color: colors.error }]}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  s.submitButton,
                  { backgroundColor: colors.bgButton },
                  (!message.trim() || sending) && s.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.7}
                disabled={!message.trim() || sending}
                accessibilityLabel="Send feedback"
                accessibilityRole="button"
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.submitText}>Send Feedback</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '600',
      flex: 1,
    },
    headerSpacer: {
      width: 32,
    },
    scrollContent: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: 40,
      maxWidth: 768,
      width: '100%',
      alignSelf: 'center',
    },
    label: {
      fontSize: fontSizes.base,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    textInput: {
      minHeight: 160,
      borderWidth: 1,
      borderRadius: radii.md,
      padding: spacing.md,
      fontSize: fontSizes.base,
      lineHeight: 22,
    },
    charCount: {
      fontSize: fontSizes.xs,
      textAlign: 'right',
      marginTop: spacing.xs,
    },
    errorText: {
      fontSize: fontSizes.sm,
      marginTop: spacing.sm,
    },
    submitButton: {
      marginTop: spacing.lg,
      paddingVertical: 12,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    sentContainer: {
      alignItems: 'center',
      paddingTop: spacing.xxl,
    },
    sentEmoji: {
      fontSize: 48,
      marginBottom: spacing.lg,
    },
    sentTitle: {
      fontSize: fontSizes['2xl'],
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    sentBody: {
      fontSize: fontSizes.base,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
  });
