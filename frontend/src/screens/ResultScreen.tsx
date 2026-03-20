import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RecipeCard from '@/components/RecipeCard';
import NotRecipePage from '@/components/NotRecipePage';
import { ArrowLeftIcon, BookmarkIcon, BookmarkFilledIcon } from '@/components/Icons';
import { useRecipeStore } from '@/store/recipeStore';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { recipeApi } from '@/api/recipeApi';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

/**
 * Displays the recipe result, "not a recipe" page, or an error fallback.
 * Back button resets the store and returns to input.
 */
export default function ResultScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { result, error, url, reset, savedRecipeId } = useRecipeStore();
  const user = useAuthStore((s) => s.user);
  const isPro = useSubscriptionStore((s) => s.isPro);

  const [saved, setSaved] = useState(!!savedRecipeId);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const FREE_RECIPE_LIMIT = 5;

  const handleSave = async () => {
    const recipe = result?.recipe;
    if (!recipe || saving || saved) return;
    setSaving(true);
    try {
      if (!isPro) {
        const count = await recipeApi.getSavedRecipeCount();
        if (count >= FREE_RECIPE_LIMIT) {
          setShowLimitModal(true);
          setSaving(false);
          return;
        }
      }
      await recipeApi.saveRecipe(recipe, url || undefined);
      setSaved(true);
    } catch {
      // Could show an error toast here
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    reset();
    router.replace('/');
  };

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
        >
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Cut The Crap</Text>
          {pageTitle ? (
            <Text style={s.headerPageTitle} numberOfLines={1}>
              — {pageTitle}
            </Text>
          ) : null}
        </View>
        {user && recipe ? (
          <TouchableOpacity
            style={s.saveButton}
            onPress={handleSave}
            disabled={saving || saved}
            activeOpacity={0.7}
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

      {/* Content */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {recipe ? (
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
            >
              <ArrowLeftIcon size={20} color={colors.text} />
              <Text style={s.tryAgainText}>Try another URL</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Recipe limit modal */}
      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowLimitModal(false)}>
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>Recipe Limit Reached</Text>
            <Text style={s.modalBody}>
              Free accounts can save up to {FREE_RECIPE_LIMIT} recipes. Upgrade to Pro for unlimited saves!
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalSecondaryBtn}
                onPress={() => setShowLimitModal(false)}
                activeOpacity={0.7}
              >
                <Text style={s.modalSecondaryText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalPrimaryBtn}
                onPress={() => {
                  setShowLimitModal(false);
                  router.push('/paywall');
                }}
                activeOpacity={0.7}
              >
                <Text style={s.modalPrimaryText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 48,
    },
    backButton: {
      position: 'absolute',
      left: 16,
      zIndex: 1,
      width: 34,
      height: 34,
      borderRadius: radii.sm,
      backgroundColor: colors.bgInput,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      position: 'absolute',
      right: 16,
      zIndex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 34,
      paddingHorizontal: 10,
      borderRadius: radii.sm,
      backgroundColor: colors.bgInput,
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
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '600',
      color: colors.text,
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
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    modalPrimaryText: {
      fontSize: fontSizes.sm,
      fontWeight: '700',
      color: '#fff',
    },
  });
