import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import theme from '../styles/theme';

/**
 * Renders a full recipe card with title, meta badges,
 * tappable ingredient checklist, numbered steps, and notes.
 */
export default function RecipeCard({ recipe, url }) {
  const [showStepIngredients, setShowStepIngredients] = useState(false);

  const hasMeta =
    recipe.prep_time || recipe.cook_time || recipe.cool_time ||
    recipe.chill_time || recipe.rest_time || recipe.marinate_time ||
    recipe.soak_time || recipe.total_time || recipe.servings;

  return (
    <View style={styles.card}>
      {/* Title & Description */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description ? (
          <Text style={styles.description}>{recipe.description}</Text>
        ) : null}
        {url ? (
          <Text
            style={styles.originalUrl}
            numberOfLines={1}
            onPress={() => Linking.openURL(url)}
          >
            {url}
          </Text>
        ) : null}
      </View>

      {/* Time & Servings Badges */}
      {hasMeta && (
        <View style={styles.metaRow}>
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
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionIcon}>🥕</Text>
            <Text style={styles.sectionHeading}>Ingredients</Text>
          </View>
          {recipe.ingredients.map((item, i) => (
            <View key={i} style={styles.ingredientItem}>
              <Text style={styles.ingredientBullet}>•</Text>
              <Text style={styles.ingredientText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionIcon}>📝</Text>
            <Text style={styles.sectionHeading}>Instructions</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Ingredients</Text>
              <Switch
                value={showStepIngredients}
                onValueChange={setShowStepIngredients}
                trackColor={{ false: theme.colors.bgInput, true: theme.colors.success }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
          {recipe.steps.map((step, i) => {
            const instruction = typeof step === 'string' ? step : step.instruction;
            const stepIngredients =
              typeof step === 'object' && step.ingredients ? step.ingredients : [];
            return (
              <View key={i} style={styles.stepWrapper}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{instruction}</Text>
                </View>
                {showStepIngredients && stepIngredients.length > 0 && (
                  <View style={styles.stepIngredients}>
                    {stepIngredients.map((ing, j) => (
                      <Text key={j} style={styles.stepIngredientText}>
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
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionIcon}>💡</Text>
            <Text style={styles.sectionHeading}>Tips & Notes</Text>
          </View>
          {recipe.notes.map((note, i) => (
            <View key={i} style={styles.noteItem}>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MetaBadge({ icon, label, value }) {
  return (
    <View style={styles.metaBadge}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <View style={styles.metaTextGroup}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
  },

  /* Header */
  headerSection: {
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  title: {
    fontSize: theme.fonts.size4xl,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 6,
    lineHeight: 32,
  },
  description: {
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.textSubtle,
    lineHeight: 24,
  },
  originalUrl: {
    marginTop: 6,
    fontSize: theme.fonts.sizeMd,
    color: theme.colors.textLight,
  },

  /* Meta badges */
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.bgSubtle,
    borderRadius: theme.radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
    minWidth: 120,
  },
  metaIcon: { fontSize: 20 },
  metaTextGroup: { flexDirection: 'column', gap: 1 },
  metaLabel: {
    fontSize: theme.fonts.sizeXs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textLight,
  },
  metaValue: {
    fontSize: theme.fonts.sizeBase,
    fontWeight: '600',
    color: theme.colors.textDark,
  },

  /* Section */
  section: {
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  sectionIcon: { fontSize: 20 },
  sectionHeading: {
    fontSize: theme.fonts.size2xl,
    fontWeight: '700',
    color: theme.colors.textDark,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: theme.fonts.sizeSm,
    color: theme.colors.textLight,
    fontWeight: '600',
  },

  /* Ingredients */
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
  },
  ingredientBullet: {
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.textLight,
    lineHeight: 21,
  },
  ingredientText: {
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.text,
    lineHeight: 21,
    flexShrink: 1,
  },

  /* Steps */
  stepWrapper: {
    marginBottom: theme.spacing.lg,
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
    backgroundColor: theme.colors.bgButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizeMd,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: theme.fonts.sizeLg,
    color: theme.colors.text,
    lineHeight: 25,
    paddingTop: 3,
  },
  stepIngredients: {
    marginLeft: 42,
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.bgSubtle,
    borderRadius: theme.radii.sm,
  },
  stepIngredientText: {
    fontSize: theme.fonts.sizeBase,
    color: theme.colors.textLight,
    lineHeight: 20,
    paddingVertical: 1,
  },

  /* Notes */
  noteItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.15)',
    borderTopRightRadius: theme.radii.sm,
    borderBottomRightRadius: theme.radii.sm,
    marginBottom: 10,
  },
  noteText: {
    fontSize: theme.fonts.sizeBase,
    color: 'rgba(0,0,0,0.65)',
    lineHeight: 22,
  },
});
