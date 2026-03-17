import React, { useState, useMemo } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { Recipe, RecipeStep } from '@/types/recipe';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

interface RecipeCardProps {
  recipe: Recipe;
  url?: string;
}

interface MetaBadgeProps {
  icon: string;
  label: string;
  value: string;
}

function MetaBadge({ icon, label, value }: MetaBadgeProps) {
  return (
    <View style={s.metaBadge}>
      <Text style={s.metaIcon}>{icon}</Text>
      <View style={s.metaTextGroup}>
        <Text style={s.metaLabel}>{label}</Text>
        <Text style={s.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * Renders a full recipe card with title, meta badges,
 * tappable ingredient checklist, numbered steps, and notes.
 */
export default function RecipeCard({ recipe, url }: RecipeCardProps) {
  const [showStepIngredients, setShowStepIngredients] = useState(false);
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  const hasMeta =
    recipe.prep_time ||
    recipe.cook_time ||
    recipe.cool_time ||
    recipe.chill_time ||
    recipe.rest_time ||
    recipe.marinate_time ||
    recipe.soak_time ||
    recipe.total_time ||
    recipe.servings;

  return (
    <View style={s.card}>
      {/* Title & Description */}
      <View style={s.headerSection}>
        <Text style={s.title}>{recipe.title}</Text>
        {recipe.description ? (
          <Text style={s.description}>{recipe.description}</Text>
        ) : null}
        {url ? (
          <Text
            style={s.originalUrl}
            numberOfLines={1}
            onPress={() => Linking.openURL(url)}
          >
            {url}
          </Text>
        ) : null}
      </View>

      {/* Time & Servings Badges */}
      {hasMeta && (
        <View style={s.metaRow}>
          {recipe.prep_time ? (
            <MetaBadge icon="🔪" label="Prep" value={recipe.prep_time} />
          ) : null}
          {recipe.cook_time ? (
            <MetaBadge icon="🍳" label="Cook" value={recipe.cook_time} />
          ) : null}
          {recipe.cool_time ? (
            <MetaBadge icon="🌡️" label="Cool" value={recipe.cool_time} />
          ) : null}
          {recipe.chill_time ? (
            <MetaBadge icon="❄️" label="Chill" value={recipe.chill_time} />
          ) : null}
          {recipe.rest_time ? (
            <MetaBadge icon="😴" label="Rest" value={recipe.rest_time} />
          ) : null}
          {recipe.marinate_time ? (
            <MetaBadge icon="🫙" label="Marinate" value={recipe.marinate_time} />
          ) : null}
          {recipe.soak_time ? (
            <MetaBadge icon="💧" label="Soak" value={recipe.soak_time} />
          ) : null}
          {recipe.total_time ? (
            <MetaBadge icon="⏱️" label="Total" value={recipe.total_time} />
          ) : null}
          {recipe.servings ? (
            <MetaBadge icon="🍽️" label="Servings" value={recipe.servings} />
          ) : null}
        </View>
      )}

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeadingRow}>
            <Text style={s.sectionIcon}>🥕</Text>
            <Text style={s.sectionHeading}>Ingredients</Text>
          </View>
          {recipe.ingredients.map((item, i) => (
            <View key={i} style={s.ingredientItem}>
              <Text style={s.ingredientBullet}>•</Text>
              <Text style={s.ingredientText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeadingRow}>
            <Text style={s.sectionIcon}>📝</Text>
            <Text style={s.sectionHeading}>Instructions</Text>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Ingredients</Text>
              <Switch
                value={showStepIngredients}
                onValueChange={setShowStepIngredients}
                trackColor={{ false: colors.bgInput, true: colors.success }}
                thumbColor={colors.white}
              />
            </View>
          </View>
          {recipe.steps.map((step, i) => {
            const instruction =
              typeof step === 'string' ? step : step.instruction;
            const stepIngredients =
              typeof step === 'object' && step.ingredients
                ? step.ingredients
                : [];
            return (
              <View key={i} style={s.stepWrapper}>
                <View style={s.stepItem}>
                  <View style={s.stepNumber}>
                    <Text style={s.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={s.stepText}>{instruction}</Text>
                </View>
                {showStepIngredients && stepIngredients.length > 0 && (
                  <View style={s.stepIngredients}>
                    {stepIngredients.map((ing, j) => (
                      <Text key={j} style={s.stepIngredientText}>
                        • {ing}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Notes */}
      {recipe.notes && recipe.notes.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeadingRow}>
            <Text style={s.sectionIcon}>💡</Text>
            <Text style={s.sectionHeading}>Tips & Notes</Text>
          </View>
          {recipe.notes.map((note, i) => (
            <View key={i} style={s.noteItem}>
              <Text style={s.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'column',
    },

    /* Header */
    headerSection: {
      paddingBottom: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      fontSize: fontSizes['4xl'],
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 6,
      lineHeight: 32,
    },
    description: {
      fontSize: fontSizes.lg,
      color: colors.textSubtle,
      lineHeight: 24,
    },
    originalUrl: {
      marginTop: 6,
      fontSize: fontSizes.md,
      color: colors.textLight,
    },

    /* Meta badges */
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.bgSubtle,
      borderRadius: radii.lg,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flex: 1,
      minWidth: 120,
    },
    metaIcon: { fontSize: 20 },
    metaTextGroup: { flexDirection: 'column', gap: 1 },
    metaLabel: {
      fontSize: fontSizes.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.textLight,
    },
    metaValue: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.textDark,
    },

    /* Section */
    section: {
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    sectionHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: spacing.lg,
    },
    sectionIcon: { fontSize: 20 },
    sectionHeading: {
      fontSize: fontSizes['2xl'],
      fontWeight: '700',
      color: colors.textDark,
      flex: 1,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    toggleLabel: {
      fontSize: fontSizes.sm,
      color: colors.textLight,
      fontWeight: '600',
    },

    /* Ingredients */
    ingredientItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radii.md,
    },
    ingredientBullet: {
      fontSize: fontSizes.lg,
      color: colors.textLight,
      lineHeight: 21,
    },
    ingredientText: {
      fontSize: fontSizes.lg,
      color: colors.text,
      lineHeight: 21,
      flexShrink: 1,
    },

    /* Steps */
    stepWrapper: {
      marginBottom: spacing.lg,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.bgButton,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepNumberText: {
      color: colors.white,
      fontSize: fontSizes.md,
      fontWeight: '700',
    },
    stepText: {
      flex: 1,
      fontSize: fontSizes.lg,
      color: colors.text,
      lineHeight: 25,
      paddingTop: 3,
    },
    stepIngredients: {
      marginLeft: 42,
      marginTop: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.bgSubtle,
      borderRadius: radii.sm,
    },
    stepIngredientText: {
      fontSize: fontSizes.base,
      color: colors.textLight,
      lineHeight: 20,
      paddingVertical: 1,
    },

    /* Notes */
    noteItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.noteItemBg,
      borderLeftWidth: 3,
      borderLeftColor: colors.noteItemBorder,
      borderTopRightRadius: radii.sm,
      borderBottomRightRadius: radii.sm,
      marginBottom: 10,
    },
    noteText: {
      fontSize: fontSizes.base,
      color: colors.noteText,
      lineHeight: 22,
    },
  });
