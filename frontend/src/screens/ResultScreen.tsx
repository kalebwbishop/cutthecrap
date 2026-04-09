import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  BackHandler,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { isAxiosError } from 'axios';
import RecipeCard from '@/components/RecipeCard';
import NotRecipePage from '@/components/NotRecipePage';
import { ArrowLeftIcon, BookmarkIcon, BookmarkFilledIcon, ShareIcon } from '@/components/Icons';
import { useRecipeStore } from '@/store/recipeStore';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { recipeApi } from '@/api/recipeApi';
import { socialApi } from '@/api/socialApi';
import { successFeedback, errorFeedback } from '@/utils/haptics';
import { copyRecipeToClipboard, formatRecipeAsText } from '@/utils/clipboard';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

/**
 * Displays the recipe result, "not a recipe" page, or an error fallback.
 * Back button resets the store and returns to input.
 *
 * On web, URL query params (savedRecipeId, historyRecipeId, url,
 * groupId+sharedRecipeId) allow the recipe to survive a page refresh.
 */
export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    savedRecipeId?: string;
    historyRecipeId?: string;
    url?: string;
    groupId?: string;
    sharedRecipeId?: string;
  }>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { result, error, url, reset, savedRecipeId, openSavedRecipe, openHistoryRecipe } =
    useRecipeStore();
  const user = useAuthStore((s) => s.user);
  const isPro = useSubscriptionStore((s) => s.isPro);

  const [saved, setSaved] = useState(!!savedRecipeId);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(false);
  const rehydrationAttempted = useRef(false);

  const FREE_RECIPE_LIMIT = 5;

  // Rehydrate store from URL query params on web refresh
  useEffect(() => {
    if (rehydrationAttempted.current) return;
    rehydrationAttempted.current = true;

    const storeHasData = result || error;
    if (storeHasData) return;

    const { savedRecipeId: paramSavedId, historyRecipeId: paramHistoryId, url: paramUrl, groupId: paramGroupId, sharedRecipeId: paramSharedId } = params;

    if (paramSavedId) {
      setIsRehydrating(true);
      openSavedRecipe(paramSavedId).finally(() => setIsRehydrating(false));
    } else if (paramHistoryId) {
      setIsRehydrating(true);
      openHistoryRecipe(paramHistoryId).finally(() => setIsRehydrating(false));
    } else if (paramGroupId && paramSharedId) {
      setIsRehydrating(true);
      socialApi
        .getSharedRecipeDetail(paramGroupId, paramSharedId)
        .then((detail) => {
          const recipe = {
            title: detail.title,
            description: detail.description,
            prep_time: detail.prepTime,
            cook_time: detail.cookTime,
            cool_time: detail.coolTime,
            chill_time: detail.chillTime,
            rest_time: detail.restTime,
            marinate_time: detail.marinateTime,
            soak_time: detail.soakTime,
            total_time: detail.totalTime,
            servings: detail.servings,
            ingredients: detail.ingredients,
            steps: detail.steps,
            notes: detail.notes,
          };
          useRecipeStore.setState({
            result: { is_recipe: true, title: detail.title, recipe },
            url: detail.sourceUrl ?? '',
            error: null,
            isLoading: false,
            savedRecipeId: null,
          });
        })
        .catch(() => {
          useRecipeStore.setState({ error: 'Failed to load shared recipe.', result: null });
        })
        .finally(() => setIsRehydrating(false));
    } else if (paramUrl) {
      setIsRehydrating(true);
      recipeApi
        .summarize(paramUrl)
        .then((data) => {
          useRecipeStore.setState({
            result: data,
            url: paramUrl,
            error: null,
            isLoading: false,
            savedRecipeId: null,
          });
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Something went wrong';
          useRecipeStore.setState({ error: `Something went wrong: ${message}`, result: null });
        })
        .finally(() => setIsRehydrating(false));
    } else {
      router.replace('/');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    if (!recipe || copied) return;
    const ok = await copyRecipeToClipboard(recipe);
    if (ok) {
      setCopied(true);
      successFeedback();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    const text = formatRecipeAsText(recipe);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: text, url: url || undefined }
          : { message: url ? `${text}\n\n${url}` : text },
        { subject: recipe.title },
      );
    } catch {
      // User cancelled or share failed — nothing to do
    }
  };

  const handleSave = async () => {
    const recipe = result?.recipe;
    if (!recipe || saving || saved) return;
    setSaving(true);
    try {
      await recipeApi.saveRecipe(recipe, url || undefined);
      setSaved(true);
      successFeedback();
    } catch (err) {
      if (
        isAxiosError(err) &&
        err.response?.status === 403 &&
        err.response?.data?.error?.code === 'RECIPE_LIMIT_REACHED'
      ) {
        setShowLimitModal(true);
      }
      errorFeedback();
    } finally {
      setSaving(false);
    }
  };

  const handleBack = useCallback(() => {
    reset();
    router.replace('/');
  }, [reset, router]);

  // Intercept Android hardware back button so it resets store state
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const recipe = result?.recipe;
  const isNotRecipe = result?.is_recipe === false;
  const summary = result?.summary;
  const pageTitle = result?.title;

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {pageTitle ? (
            <Text style={s.headerPageTitle} numberOfLines={1}>
              {pageTitle}
            </Text>
          ) : null}
        </View>
        {recipe ? (
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.copyButton}
              onPress={handleCopy}
              disabled={copied}
              activeOpacity={0.7}
              accessibilityLabel={copied ? "Recipe copied" : "Copy recipe to clipboard"}
              accessibilityRole="button"
            >
              <Text style={[s.copyButtonText, copied && { color: colors.success }]}>
                {copied ? '✓ Copied' : '📋 Copy'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.shareButton}
              onPress={handleShare}
              activeOpacity={0.7}
              accessibilityLabel="Share recipe"
              accessibilityRole="button"
            >
              <ShareIcon size={18} color={colors.text} />
            </TouchableOpacity>
            {user ? (
              <TouchableOpacity
                style={s.saveButton}
                onPress={handleSave}
                disabled={saving || saved}
                activeOpacity={0.7}
                accessibilityLabel={saved ? "Recipe saved" : "Save recipe"}
                accessibilityRole="button"
              >
                {saved ? (
                  <BookmarkFilledIcon size={20} color={colors.success} />
                ) : (
                  <BookmarkIcon size={20} color={colors.text} />
                )}
                <Text style={[s.saveButtonText, saved && { color: colors.success }]}>
                  {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Content */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isRehydrating ? (
          <View style={s.rehydratingContainer}>
            <ActivityIndicator size="large" color={colors.bgButton} />
            <Text style={s.rehydratingText}>Loading recipe…</Text>
          </View>
        ) : recipe ? (
          <RecipeCard recipe={recipe} url={url} />
        ) : isNotRecipe ? (
          <NotRecipePage title={pageTitle} onBack={handleBack} />
        ) : error ? (
          <View style={s.responseContent}>
            <Text style={s.responseText}>{error}</Text>
            <TouchableOpacity
              style={s.tryAgainButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityLabel="Try another URL"
              accessibilityRole="button"
            >
              <ArrowLeftIcon size={20} color={colors.text} />
              <Text style={s.tryAgainText}>Try another URL</Text>
            </TouchableOpacity>
          </View>
        ) : summary ? (
          <View style={s.responseContent}>
            <Text style={s.responseText}>{summary}</Text>
            <TouchableOpacity
              style={s.tryAgainButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityLabel="Try another URL"
              accessibilityRole="button"
            >
              <ArrowLeftIcon size={20} color={colors.text} />
              <Text style={s.tryAgainText}>Try another URL</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>


    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 48,
      gap: 8,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: radii.sm,
      backgroundColor: colors.bgInput,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 34,
      paddingHorizontal: 10,
      borderRadius: radii.sm,
      backgroundColor: colors.bgInput,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    copyButton: {
      height: 34,
      paddingHorizontal: 10,
      borderRadius: radii.sm,
      backgroundColor: colors.bgInput,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareButton: {
      width: 34,
      height: 34,
      borderRadius: radii.sm,
      backgroundColor: colors.bgInput,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copyButtonText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.text,
    },
    saveButtonText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.text,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      overflow: 'hidden',
    },
    headerPageTitle: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      flexShrink: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      maxWidth: 768,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.xxl,
    },
    responseContent: {
      alignItems: 'center',
    },
    rehydratingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      gap: spacing.md,
    },
    rehydratingText: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
    },
    responseText: {
      fontSize: fontSizes.lg,
      color: colors.text,
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
      borderRadius: radii.md,
      backgroundColor: colors.bgInput,
    },
    tryAgainText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      width: '85%',
      maxWidth: 360,
      backgroundColor: colors.background,
      borderRadius: radii.lg,
      padding: spacing.xxl,
    },
    modalTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    modalBody: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
    },
    modalSecondaryBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    modalSecondaryText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.textMuted,
    },
    modalPrimaryBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: colors.bgButton,
      alignItems: 'center',
    },
    modalPrimaryText: {
      fontSize: fontSizes.sm,
      fontWeight: '700',
      color: '#fff',
    },
  });
