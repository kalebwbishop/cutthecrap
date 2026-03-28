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
  error_code?: number;
}

/** Response from GET /api/health */
export interface HealthCheckResponse {
  status: string;
}

/** Possible API connection statuses */
export type ApiStatus = 'checking' | 'healthy' | 'unreachable';

/** Lightweight saved-recipe entry used in the sidebar list. */
export interface SavedRecipeSummary {
  id: string;
  title: string;
  sourceUrl?: string;
  folderId?: string | null;
  createdAt?: string;
}

/** Full saved-recipe returned by GET /recipes/:id. */
export interface SavedRecipeDetail {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  folderId?: string | null;
  prepTime?: string;
  cookTime?: string;
  coolTime?: string;
  chillTime?: string;
  restTime?: string;
  marinateTime?: string;
  soakTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients: string[];
  steps: (string | RecipeStep)[];
  notes?: string[];
  createdAt?: string;
}

/** A recipe folder for organizing saved recipes. */
export interface RecipeFolder {
  id: string;
  name: string;
  recipeCount: number;
  createdAt?: string;
}
