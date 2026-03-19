import axios from 'axios';
import apiClient from './client';
import {
  HealthCheckResponse,
  Recipe,
  RecipeStep,
  SavedRecipeDetail,
  SavedRecipeSummary,
  SummarizeResponse,
} from '@/types/recipe';

// ── error messages ──────────────────────────────────────────────────

const STATUS_MESSAGES: Record<number, string> = {
  400: "🤔 The server said 'nah, bad request.' Maybe the URL is having an identity crisis?",
  401: '🔐 Whoa there! That page wants a password. We do not do break-ins here.',
  403: "🚫 Forbidden fruit! That page does not want to be read. Respect its boundaries.",
  404: '👻 Page not found! It is either hiding or it never existed. Spooky.',
  405: '🙅 Method not allowed - we knocked, but apparently we used the wrong hand.',
  408: '⏰ Request timed out. The server went for a coffee break and never came back.',
  429: '🐌 Too many requests! Slow down, speed racer. The server needs a breather.',
  500: '💥 Internal server error! Something blew up on their end. Not our fault, pinky swear.',
  502: '🌉 Bad gateway - the internet bridge is broken. Try swimming across?',
  503: '😴 Service unavailable. The server is napping. Try poking it later.',
  504: '⌛ Gateway timeout. We waited and waited... and then gave up. Classic.',
};

const DEFAULT_STATUS_MESSAGES = [
  '🤷 Well, that did not work. The server responded, but not in a good way.',
  '😬 Awkward... the server sent back something unexpected. Let us pretend this did not happen.',
  '🫠 The server melted a little. Give it a moment to pull itself together.',
] as const;

// ── types ───────────────────────────────────────────────────────────

interface BackendParseResponse {
  success?: boolean;
  data?: unknown;
  error?: string;
  status_code?: number;
}

type ParsedRecipe = Recipe & { is_recipe: boolean };

// ── helpers ─────────────────────────────────────────────────────────

function getStatusErrorMessage(statusCode: number): string {
  return STATUS_MESSAGES[statusCode] ??
    DEFAULT_STATUS_MESSAGES[statusCode % DEFAULT_STATUS_MESSAGES.length];
}

function buildSummaryResponse(summary: string, errorCode?: number): SummarizeResponse {
  return {
    title: 'Oops!',
    is_recipe: true,
    summary,
    error_code: errorCode,
  };
}

function stripMarkdownFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
}

function normalizeSteps(steps: unknown): Array<string | RecipeStep> {
  if (!Array.isArray(steps)) return [];

  return (steps as unknown[]).flatMap((step): Array<string | RecipeStep> => {
    if (typeof step === 'string') {
      return step.trim() ? [step.trim()] : [];
    }

    if (!step || typeof step !== 'object') {
      return [];
    }

    const candidate = step as Partial<RecipeStep>;
    if (typeof candidate.instruction !== 'string' || !candidate.instruction.trim()) {
      return [];
    }

    return [{
      instruction: candidate.instruction.trim(),
      ingredients: Array.isArray(candidate.ingredients)
        ? candidate.ingredients.filter((ingredient): ingredient is string => typeof ingredient === 'string')
        : [],
    }];
  });
}

function normalizeRecipePayload(payload: unknown): ParsedRecipe | null {
  let normalized = payload;

  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(stripMarkdownFences(normalized));
    } catch {
      return null;
    }
  }

  if (!normalized || typeof normalized !== 'object') {
    return null;
  }

  const candidate = normalized as Partial<ParsedRecipe>;
  if (typeof candidate.is_recipe !== 'boolean' || typeof candidate.title !== 'string') {
    return null;
  }

  return {
    ...candidate,
    is_recipe: candidate.is_recipe,
    title: candidate.title.trim(),
    description: typeof candidate.description === 'string' ? candidate.description : undefined,
    prep_time: typeof candidate.prep_time === 'string' ? candidate.prep_time : undefined,
    cook_time: typeof candidate.cook_time === 'string' ? candidate.cook_time : undefined,
    cool_time: typeof candidate.cool_time === 'string' ? candidate.cool_time : undefined,
    chill_time: typeof candidate.chill_time === 'string' ? candidate.chill_time : undefined,
    rest_time: typeof candidate.rest_time === 'string' ? candidate.rest_time : undefined,
    marinate_time: typeof candidate.marinate_time === 'string' ? candidate.marinate_time : undefined,
    soak_time: typeof candidate.soak_time === 'string' ? candidate.soak_time : undefined,
    total_time: typeof candidate.total_time === 'string' ? candidate.total_time : undefined,
    servings: typeof candidate.servings === 'string' ? candidate.servings : undefined,
    ingredients: Array.isArray(candidate.ingredients)
      ? candidate.ingredients.filter((ingredient): ingredient is string => typeof ingredient === 'string')
      : [],
    steps: normalizeSteps(candidate.steps),
    notes: Array.isArray(candidate.notes)
      ? candidate.notes.filter((note): note is string => typeof note === 'string')
      : [],
  };
}

// ── public API ──────────────────────────────────────────────────────

export const recipeApi = {
  async checkHealth(): Promise<HealthCheckResponse> {
    await apiClient.get('/api/health', { responseType: 'text' });
    return { status: 'healthy' };
  },

  async summarize(url: string): Promise<SummarizeResponse> {
    try {
      const response = await apiClient.post<BackendParseResponse>('/api/v1/chatgpt/parse-url', {
        url,
      });

      if (response.data?.success) {
        const recipe = normalizeRecipePayload(response.data.data);
        if (recipe?.is_recipe) return { title: recipe.title, is_recipe: true, recipe };
        if (recipe && !recipe.is_recipe) return { title: recipe.title, is_recipe: false };
      }

      console.log('Unexpected response from backend:', response.data);

      return buildSummaryResponse(
        '🤔 Could not extract a recipe from that page.\n\n📋 Error code: PARSE_FAILED',
        0,
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const backendStatus: number | undefined = error.response.data?.status_code;
        const httpStatus = backendStatus ?? error.response.status;
        return buildSummaryResponse(
          `${getStatusErrorMessage(httpStatus)}\n\n📋 Error code: ${httpStatus}`,
          httpStatus,
        );
      }

      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        return buildSummaryResponse(
          '⏰ The request timed out! That site is slower than a Monday morning.\n\n📋 Error code: TIMEOUT',
          408,
        );
      }

      return buildSummaryResponse(
        '🔌 Could not reach the backend. Make sure the server is running.\n\n📋 Error code: CONNECTION_FAILED',
        0,
      );
    }
  },

  async getSavedRecipes(): Promise<SavedRecipeSummary[]> {
    const resp = await apiClient.get<{ recipes: SavedRecipeSummary[] }>('/api/v1/recipes');
    return resp.data.recipes;
  },

  async getSavedRecipeCount(): Promise<number> {
    const resp = await apiClient.get<{ count: number }>('/api/v1/recipes/count');
    return resp.data.count;
  },

  async getRecipeById(id: string): Promise<SavedRecipeDetail> {
    const resp = await apiClient.get<{ recipe: SavedRecipeDetail }>(`/api/v1/recipes/${id}`);
    return resp.data.recipe;
  },

  async saveRecipe(recipe: Recipe, sourceUrl?: string): Promise<SavedRecipeSummary> {
    const resp = await apiClient.post<{ recipe: SavedRecipeSummary }>('/api/v1/recipes', {
      title: recipe.title,
      description: recipe.description,
      sourceUrl,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      coolTime: recipe.cool_time,
      chillTime: recipe.chill_time,
      restTime: recipe.rest_time,
      marinateTime: recipe.marinate_time,
      soakTime: recipe.soak_time,
      totalTime: recipe.total_time,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      notes: recipe.notes ?? [],
    });
    return resp.data.recipe;
  },
};
