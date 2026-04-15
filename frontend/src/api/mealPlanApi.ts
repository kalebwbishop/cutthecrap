import { apiClient } from './client';
import type { MealPlanRequest, MealPlanResult } from '@/types/mealPlan';

export const mealPlanApi = {
  async generateMealPlan(config: MealPlanRequest): Promise<MealPlanResult> {
    const response = await apiClient.post('/api/v1/meal-plan/generate', config);
    const data = response.data;

    if (data?.data) {
      return data.data as MealPlanResult;
    }

    if (data?.days && data?.groceryList) {
      return data as MealPlanResult;
    }

    throw new Error(data?.error?.message || 'Failed to generate meal plan');
  },
};
