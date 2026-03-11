import apiClient from './client';
import { SummarizeResponse, HealthCheckResponse } from '@/types/recipe';

/**
 * Recipe-scraper API endpoints.
 */
export const recipeApi = {
  /** Check if the backend is reachable. */
  async checkHealth(): Promise<HealthCheckResponse> {
    const { data } = await apiClient.get<HealthCheckResponse>('/health');
    return data;
  },

  /** Submit a URL for recipe extraction. */
  async summarize(url: string): Promise<SummarizeResponse> {
    const { data } = await apiClient.post<SummarizeResponse>('/summarize', { url });
    return data;
  },
};
