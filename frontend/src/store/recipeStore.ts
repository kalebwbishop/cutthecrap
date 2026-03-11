import { create } from 'zustand';
import { recipeApi } from '@/api/recipeApi';
import { SummarizeResponse, ApiStatus } from '@/types/recipe';

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

  /* API health */
  apiStatus: ApiStatus;

  /* Actions */
  setUrl: (url: string) => void;
  submitUrl: () => Promise<void>;
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

  reset: () =>
    set({
      url: '',
      urlError: '',
      isLoading: false,
      loadingMessageIndex: 0,
      result: null,
      error: null,
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
