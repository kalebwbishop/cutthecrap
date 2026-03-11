import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RecipeCard from '@/components/RecipeCard';
import NotRecipePage from '@/components/NotRecipePage';
import { ArrowLeftIcon } from '@/components/Icons';
import { useRecipeStore } from '@/store/recipeStore';
import { colors, fontSizes, spacing, radii } from '@/theme';

/**
 * Displays the recipe result, "not a recipe" page, or an error fallback.
 * Back button resets the store and returns to input.
 */
export default function ResultScreen() {
  const router = useRouter();
  const { result, error, url, reset } = useRecipeStore();

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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
});
