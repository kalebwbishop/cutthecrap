import { create } from 'zustand';
import { recipeApi } from '@/api/recipeApi';
import { SummarizeResponse, SavedRecipeDetail, ApiStatus } from '@/types/recipe';

const LOADING_MESSAGES = [
  'Scraping the page…',
  'Skipping the life story…',
  'Ignoring the pop-ups…',
  'Dodging the ads…',
  'Finding the actual recipe…',
  'Almost there…',
] as const;

interface RecipeState {
  /* Input */
  url: string;
  urlError: string;

  /* Loading */
  isLoading: boolean;
  loadingMessageIndex: number;

  /* Result */
  result: SummarizeResponse | null;
  error: string | null;
  savedRecipeId: string | null;

  /* API health */
  apiStatus: ApiStatus;

  /* Actions */
  setUrl: (url: string) => void;
  submitUrl: () => Promise<void>;
  openSavedRecipe: (id: string) => Promise<void>;
  reset: () => void;
  checkHealth: () => Promise<void>;
  cycleLoadingMessage: () => void;
}

/** Validate that text is a proper HTTP(S) URL. */
function isValidUrl(text: string): boolean {
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  url: '',
  urlError: '',
  isLoading: false,
  loadingMessageIndex: 0,
  result: null,
  error: null,
  savedRecipeId: null,
  apiStatus: 'checking',

  setUrl: (url: string) => set({ url, urlError: '' }),

  submitUrl: async () => {
    const { url, isLoading, apiStatus } = get();
    const trimmed = url.trim();

    if (!trimmed || isLoading) return;
    if (apiStatus !== 'healthy') return;

    if (!isValidUrl(trimmed)) {
      set({ urlError: 'Please enter a valid URL (e.g. https://example.com)' });
      return;
    }

    set({
      isLoading: true,
      loadingMessageIndex: 0,
      result: null,
      error: null,
      urlError: '',
      savedRecipeId: null,
    });

    try {
      const data = await recipeApi.summarize(trimmed);
      set({ result: data, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      set({ error: `Something went wrong: ${message}`, isLoading: false });
    }
  },

  openSavedRecipe: async (id: string) => {
    try {
      const detail = await recipeApi.getRecipeById(id);
      const recipe = {
        title: detail.title,
        description: detail.description,
        prep_time: detail.prepTime,
        cook_time: detail.cookTime,
        cool_time: detail.coolTime,
        chill_time: detail.chillTime,
        rest_time: detail.restTime,
        marinate_time: detail.marinateTime,
        soak_time: detail.soakTime,
        total_time: detail.totalTime,
        servings: detail.servings,
        ingredients: detail.ingredients,
        steps: detail.steps,
        notes: detail.notes,
      };
      set({
        result: { is_recipe: true, title: detail.title, recipe },
        url: detail.sourceUrl ?? '',
        error: null,
        isLoading: false,
        savedRecipeId: detail.id,
      });
    } catch {
      set({ error: 'Failed to load saved recipe.', result: null, isLoading: false });
    }
  },

  reset: () =>
    set({
      url: '',
      urlError: '',
      isLoading: false,
      loadingMessageIndex: 0,
      result: null,
      error: null,
      savedRecipeId: null,
    }),

  checkHealth: async () => {
    set({ apiStatus: 'checking' });
    try {
      await recipeApi.checkHealth();
      set({ apiStatus: 'healthy' });
    } catch {
      set({ apiStatus: 'unreachable' });
    }
  },

  cycleLoadingMessage: () =>
    set((s) => ({
      loadingMessageIndex:
        (s.loadingMessageIndex + 1) % LOADING_MESSAGES.length,
    })),
}));

export { LOADING_MESSAGES };
