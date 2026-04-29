import { create } from 'zustand';
import { mealPlanApi } from '@/api/mealPlanApi';
import { DEFAULT_DAYS, DEFAULT_MEAL_TYPES } from '@/types/mealPlan';
import type { MealPlanResult, MealType } from '@/types/mealPlan';

interface MealPlanState {
  // Config
  selectedRecipeIds: string[];
  days: number;
  mealsPerDay: MealType[];

  // Result
  isLoading: boolean;
  result: MealPlanResult | null;
  error: string | null;

  // Actions
  setSelectedRecipeIds: (ids: string[]) => void;
  toggleRecipeId: (id: string) => void;
  setDays: (days: number) => void;
  setMealsPerDay: (meals: MealType[]) => void;
  generate: () => Promise<void>;
  reset: () => void;
  clearResult: () => void;
}

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  selectedRecipeIds: [],
  days: DEFAULT_DAYS,
  mealsPerDay: [...DEFAULT_MEAL_TYPES],
  isLoading: false,
  result: null,
  error: null,

  setSelectedRecipeIds: (ids) => set({ selectedRecipeIds: ids }),

  toggleRecipeId: (id) => {
    const { selectedRecipeIds } = get();
    if (selectedRecipeIds.includes(id)) {
      set({ selectedRecipeIds: selectedRecipeIds.filter((r) => r !== id) });
    } else {
      set({ selectedRecipeIds: [...selectedRecipeIds, id] });
    }
  },

  setDays: (days) => set({ days: Math.max(1, Math.min(7, days)) }),

  setMealsPerDay: (meals) => set({ mealsPerDay: meals }),

  generate: async () => {
    const { selectedRecipeIds, days, mealsPerDay } = get();
    set({ isLoading: true, error: null, result: null });

    try {
      const result = await mealPlanApi.generateMealPlan({
        selectedRecipeIds,
        days,
        mealsPerDay,
      });
      set({ result, isLoading: false });
    } catch (e: any) {
      const message =
        e?.response?.data?.error?.message ??
        e?.message ??
        'Failed to generate meal plan';
      set({ error: message, isLoading: false });
    }
  },

  reset: () =>
    set({
      selectedRecipeIds: [],
      days: DEFAULT_DAYS,
      mealsPerDay: [...DEFAULT_MEAL_TYPES],
      isLoading: false,
      result: null,
      error: null,
    }),

  clearResult: () => set({ result: null, error: null }),
}));
