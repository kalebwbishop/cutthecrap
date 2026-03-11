/**
 * TypeScript interfaces for the Cut The Crap recipe scraper.
 */

/** A single step in a recipe, optionally with associated ingredients. */
export interface RecipeStep {
  instruction: string;
  ingredients?: string[];
}

/** The full structured recipe returned by the backend. */
export interface Recipe {
  title: string;
  description?: string;
  source_url?: string;
  prep_time?: string;
  cook_time?: string;
  cool_time?: string;
  chill_time?: string;
  rest_time?: string;
  marinate_time?: string;
  soak_time?: string;
  total_time?: string;
  servings?: string;
  ingredients: string[];
  steps: (string | RecipeStep)[];
  notes?: string[];
}

/** Response from POST /summarize */
export interface SummarizeResponse {
  is_recipe: boolean;
  title?: string;
  recipe?: Recipe;
  summary?: string;
}

/** Response from GET /health */
export interface HealthCheckResponse {
  status: string;
}

/** Possible API connection statuses */
export type ApiStatus = 'checking' | 'healthy' | 'unreachable';
