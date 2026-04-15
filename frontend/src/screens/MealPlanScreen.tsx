import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon, CheckboxCheckedIcon, CheckboxUncheckedIcon } from '@/components/Icons';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { recipeApi } from '@/api/recipeApi';
import type { SavedRecipeSummary } from '@/types/recipe';
import type { MealType, MealPlanDay, GroceryItem } from '@/types/mealPlan';
import { MEAL_TYPE_LABELS, DEFAULT_MEAL_TYPES } from '@/types/mealPlan';

const MAX_WEB_WIDTH = 768;

const LOADING_MESSAGES = [
  'Planning your meals...',
  'Picking the perfect recipes...',
  'Balancing your week...',
  'Building your grocery list...',
  'Almost there...',
];

export default function MealPlanScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const user = useAuthStore((st) => st.user);
  const isPro = useSubscriptionStore((st) => st.isPro);

  const {
    selectedRecipeIds, toggleRecipeId, setSelectedRecipeIds,
    days, setDays,
    mealsPerDay, setMealsPerDay,
    isLoading, result, error,
    generate, clearResult,
  } = useMealPlanStore();

  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeSummary[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'plan' | 'grocery'>('plan');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  // Fetch saved recipes on mount
  useEffect(() => {
    if (!user) return;
    setLoadingRecipes(true);
    recipeApi
      .getSavedRecipes()
      .then((recipes) => setSavedRecipes(recipes))
      .catch(() => setSavedRecipes([]))
      .finally(() => setLoadingRecipes(false));
  }, [user]);

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Expand all days when result arrives
  useEffect(() => {
    if (result) {
      setExpandedDays(new Set(result.days.map((d) => d.dayNumber)));
    }
  }, [result]);

  const handleBack = () => {
    if (result) {
      clearResult();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const toggleDay = useCallback((dayNum: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  }, []);

  const toggleMealType = useCallback(
    (meal: MealType) => {
      if (mealsPerDay.includes(meal)) {
        if (mealsPerDay.length > 1) {
          setMealsPerDay(mealsPerDay.filter((m) => m !== meal));
        }
      } else {
        setMealsPerDay([...mealsPerDay, meal].sort(
          (a, b) => DEFAULT_MEAL_TYPES.indexOf(a) - DEFAULT_MEAL_TYPES.indexOf(b)
        ));
      }
    },
    [mealsPerDay, setMealsPerDay],
  );

  // ── Pro gate ──────────────────────────────────────────────────────

  if (!user) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={s.title}>Sign in Required</Text>
          <Text style={s.subtitle}>Sign in to use AI Meal Planning.</Text>
          <TouchableOpacity style={s.primaryButton} onPress={() => router.push('/upgrade')}>
            <Text style={s.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isPro) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12}>
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>AI Meal Planning</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.centered}>
          <Text style={s.title}>Pro Feature</Text>
          <Text style={s.subtitle}>
            AI Meal Planning is available for Pro subscribers.{'\n'}
            Upgrade to generate weekly meal plans and grocery lists.
          </Text>
          <TouchableOpacity style={s.primaryButton} onPress={() => router.push('/upgrade')}>
            <Text style={s.primaryButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result state ──────────────────────────────────────────────────

  if (result) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.content}>
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} hitSlop={12}>
              <ArrowLeftIcon size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Your Meal Plan</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tab bar */}
          <View style={s.tabBar}>
            <TouchableOpacity
              style={[s.tab, activeTab === 'plan' && s.activeTab]}
              onPress={() => setActiveTab('plan')}
            >
              <Text style={[s.tabText, activeTab === 'plan' && s.activeTabText]}>
                Meal Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, activeTab === 'grocery' && s.activeTab]}
              onPress={() => setActiveTab('grocery')}
            >
              <Text style={[s.tabText, activeTab === 'grocery' && s.activeTabText]}>
                Grocery List
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.scrollArea} contentContainerStyle={s.scrollContent}>
            {activeTab === 'plan'
              ? result.days.map((day) => renderDay(day, expandedDays.has(day.dayNumber), toggleDay, s, colors))
              : renderGroceryList(result.groceryList, s)}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ── Config state (default) ────────────────────────────────────────

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12}>
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>AI Meal Planning</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={s.scrollArea} contentContainerStyle={s.scrollContent}>
          {/* Days selector */}
          <Text style={s.sectionTitle}>How many days?</Text>
          <View style={s.chipRow}>
            {[1, 3, 5, 7].map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.chip, days === d && s.chipActive]}
                onPress={() => setDays(d)}
              >
                <Text style={[s.chipText, days === d && s.chipTextActive]}>
                  {d} {d === 1 ? 'day' : 'days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meal types */}
          <Text style={s.sectionTitle}>Meals per day</Text>
          <View style={s.chipRow}>
            {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((meal) => (
              <TouchableOpacity
                key={meal}
                style={[s.chip, mealsPerDay.includes(meal) && s.chipActive]}
                onPress={() => toggleMealType(meal)}
              >
                <Text style={[s.chipText, mealsPerDay.includes(meal) && s.chipTextActive]}>
                  {MEAL_TYPE_LABELS[meal]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recipe selector */}
          <Text style={s.sectionTitle}>
            Include saved recipes{' '}
            <Text style={s.sectionHint}>({selectedRecipeIds.length} selected)</Text>
          </Text>

          {loadingRecipes ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : savedRecipes.length === 0 ? (
            <Text style={s.emptyText}>
              No saved recipes yet. Your meal plan will be fully AI-generated.
            </Text>
          ) : (
            savedRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={s.recipeRow}
                onPress={() => toggleRecipeId(recipe.id)}
                activeOpacity={0.7}
              >
                {selectedRecipeIds.includes(recipe.id) ? (
                  <CheckboxCheckedIcon size={20} />
                ) : (
                  <CheckboxUncheckedIcon size={20} />
                )}
                <Text style={s.recipeTitle} numberOfLines={1}>
                  {recipe.title}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {selectedRecipeIds.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedRecipeIds([])} style={s.clearLink}>
              <Text style={s.clearLinkText}>Clear selection</Text>
            </TouchableOpacity>
          )}

          {error && <Text style={s.errorText}>{error}</Text>}
        </ScrollView>

        {/* Generate button */}
        <View style={s.footer}>
          <TouchableOpacity style={s.primaryButton} onPress={generate} activeOpacity={0.8}>
            <Text style={s.primaryButtonText}>Generate Meal Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Render helpers ────────────────────────────────────────────────────

function renderDay(
  day: MealPlanDay,
  expanded: boolean,
  onToggle: (n: number) => void,
  s: ReturnType<typeof createStyles>,
  colors: ThemeColors,
) {
  return (
    <View key={day.dayNumber} style={s.dayCard}>
      <TouchableOpacity style={s.dayHeader} onPress={() => onToggle(day.dayNumber)} activeOpacity={0.7}>
        <Text style={s.dayTitle}>Day {day.dayNumber}</Text>
        <Text style={s.expandHint}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded &&
        day.meals.map((meal, idx) => (
          <View key={idx} style={s.mealCard}>
            <View style={s.mealHeader}>
              <Text style={s.mealType}>{meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}</Text>
              {meal.source === 'saved' && (
                <View style={[s.badge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.badgeText, { color: colors.primary }]}>Saved</Text>
                </View>
              )}
            </View>
            <Text style={s.mealTitle}>{meal.title}</Text>
            <Text style={s.mealDesc}>{meal.description}</Text>
            {(meal.prepTime || meal.cookTime) && (
              <Text style={s.mealTime}>
                {[meal.prepTime && `Prep: ${meal.prepTime}`, meal.cookTime && `Cook: ${meal.cookTime}`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
          </View>
        ))}
    </View>
  );
}

function renderGroceryList(items: GroceryItem[], s: ReturnType<typeof createStyles>) {
  const grouped: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return (
    <View>
      {Object.entries(grouped).map(([category, catItems]) => (
        <View key={category} style={s.groceryCategory}>
          <Text style={s.groceryCategoryTitle}>{category}</Text>
          {catItems.map((gi, idx) => (
            <View key={idx} style={s.groceryRow}>
              <Text style={s.groceryItem}>{gi.item}</Text>
              <Text style={s.groceryQty}>{gi.quantity}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      width: '100%',
      maxWidth: MAX_WEB_WIDTH,
      alignSelf: 'center',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: colors.text,
    },
    title: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: fontSizes.md,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },

    // Config
    sectionTitle: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionHint: {
      fontWeight: '400',
      color: colors.textMuted,
      fontSize: fontSizes.sm,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: fontSizes.sm,
      color: colors.text,
    },
    chipTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    recipeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    recipeTitle: {
      flex: 1,
      fontSize: fontSizes.md,
      color: colors.text,
    },
    clearLink: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    clearLinkText: {
      fontSize: fontSizes.sm,
      color: colors.primary,
    },
    emptyText: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginVertical: spacing.md,
    },
    errorText: {
      fontSize: fontSizes.sm,
      color: colors.error,
      marginTop: spacing.md,
    },

    // Footer
    footer: {
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: fontSizes.md,
      fontWeight: '700',
    },

    // Loading
    loadingText: {
      fontSize: fontSizes.md,
      color: colors.textMuted,
      marginTop: spacing.lg,
    },

    // Result tabs
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      marginHorizontal: spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: fontSizes.md,
      color: colors.textMuted,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },

    // Day / Meal cards
    dayCard: {
      marginBottom: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
    },
    dayTitle: {
      fontSize: fontSizes.md,
      fontWeight: '700',
      color: colors.text,
    },
    expandHint: {
      fontSize: fontSizes.md,
      color: colors.textMuted,
    },
    mealCard: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    mealHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    mealType: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    badge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: radii.sm,
    },
    badgeText: {
      fontSize: fontSizes.xs,
      fontWeight: '600',
    },
    mealTitle: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    mealDesc: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: 4,
    },
    mealTime: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
    },

    // Grocery list
    groceryCategory: {
      marginBottom: spacing.lg,
    },
    groceryCategoryTitle: {
      fontSize: fontSizes.md,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
      textTransform: 'capitalize',
    },
    groceryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    groceryItem: {
      fontSize: fontSizes.md,
      color: colors.text,
      flex: 1,
    },
    groceryQty: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginLeft: spacing.sm,
    },
  });
}
