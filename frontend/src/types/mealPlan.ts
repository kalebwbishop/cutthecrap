export interface MealPlanMeal {
  mealType: string;
  source: 'saved' | 'generated';
  savedRecipeId: string | null;
  title: string;
  description: string;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: string[];
  steps: string[];
}

export interface MealPlanDay {
  dayNumber: number;
  meals: MealPlanMeal[];
}

export interface GroceryItem {
  item: string;
  quantity: string;
  category: string;
}

export interface MealPlanResult {
  days: MealPlanDay[];
  groceryList: GroceryItem[];
}

export interface MealPlanRequest {
  selectedRecipeIds: string[];
  days: number;
  mealsPerDay: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export const DEFAULT_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
export const DEFAULT_DAYS = 7;
