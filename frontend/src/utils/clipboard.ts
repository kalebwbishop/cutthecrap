import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Recipe, RecipeStep } from '@/types/recipe';

/**
 * Formats a recipe as plain text and copies it to the clipboard.
 * Returns true on success.
 */
export async function copyRecipeToClipboard(recipe: Recipe): Promise<boolean> {
  try {
    const text = formatRecipeAsText(recipe);
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

function formatRecipeAsText(recipe: Recipe): string {
  const lines: string[] = [];

  lines.push(recipe.title);
  if (recipe.description) lines.push(recipe.description);
  lines.push('');

  // Time/servings metadata
  const meta: string[] = [];
  if (recipe.prep_time) meta.push(`Prep: ${recipe.prep_time}`);
  if (recipe.cook_time) meta.push(`Cook: ${recipe.cook_time}`);
  if (recipe.total_time) meta.push(`Total: ${recipe.total_time}`);
  if (recipe.servings) meta.push(`Servings: ${recipe.servings}`);
  if (meta.length) {
    lines.push(meta.join(' | '));
    lines.push('');
  }

  // Ingredients
  if (recipe.ingredients?.length) {
    lines.push('INGREDIENTS');
    for (const item of recipe.ingredients) {
      lines.push(`• ${item}`);
    }
    lines.push('');
  }

  // Steps
  if (recipe.steps?.length) {
    lines.push('INSTRUCTIONS');
    recipe.steps.forEach((step, i) => {
      const instruction = typeof step === 'string' ? step : step.instruction;
      lines.push(`${i + 1}. ${instruction}`);
    });
    lines.push('');
  }

  // Notes
  if (recipe.notes?.length) {
    lines.push('NOTES');
    for (const note of recipe.notes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join('\n').trim();
}
