import axios from 'axios';
import { Platform } from 'react-native';
import apiClient, { CHATGPT_API_KEY } from './client';
import {
  HealthCheckResponse,
  Recipe,
  RecipeStep,
  SummarizeResponse,
} from '@/types/recipe';

const RECIPE_SYSTEM_PROMPT = `You are a recipe extraction assistant. Given the raw text content of a web page, first determine if the page contains a recipe.

Set is_recipe to true if the page contains an actual recipe with ingredients and cooking instructions.
Set is_recipe to false if the page is not a recipe (e.g. a blog post, news article, homepage, product page, etc.).

If is_recipe is false, still provide a short title describing what the page is, and set all other fields to null or empty arrays.

If is_recipe is true, extract the full recipe:
- ingredients should be the complete list of individual items with quantities included.
- steps should be clear, concise instructions in the same order as the original recipe. Each step has:
  - "instruction": the step text.
  - "ingredients": a list of the specific ingredients (with quantities) used in that step. If no ingredients are used in a step, use an empty list.
- notes can include tips, substitutions, storage info, etc. Use an empty array if none.
- Extract all relevant time categories when available:
  - prep_time: hands-on preparation time (chopping, mixing, etc.)
  - cook_time: active cooking time (on the stove, in the oven, etc.)
  - cool_time: time for cooling down after cooking
  - chill_time: refrigeration or chilling time
  - rest_time: resting time (for dough rising, meat resting, etc.)
  - marinate_time: time spent marinating
  - soak_time: time spent soaking ingredients
  - total_time: the overall total time from start to finish
- Only include a time category if it genuinely applies. Use null for times that don't apply.
- If something is truly not findable, use null for strings or empty arrays for lists.
- Clean up any ad copy, SEO filler, or life-story content - just the recipe facts.`;

const RECIPE_RESPONSE_FORMAT = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'recipe_extraction',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        is_recipe: { type: 'boolean' },
        title: { type: 'string' },
        description: { type: ['string', 'null'] },
        prep_time: { type: ['string', 'null'] },
        cook_time: { type: ['string', 'null'] },
        cool_time: { type: ['string', 'null'] },
        chill_time: { type: ['string', 'null'] },
        rest_time: { type: ['string', 'null'] },
        marinate_time: { type: ['string', 'null'] },
        soak_time: { type: ['string', 'null'] },
        total_time: { type: ['string', 'null'] },
        servings: { type: ['string', 'null'] },
        ingredients: { type: 'array', items: { type: 'string' } },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instruction: { type: 'string' },
              ingredients: { type: 'array', items: { type: 'string' } },
            },
            required: ['instruction', 'ingredients'],
            additionalProperties: false,
          },
        },
        notes: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'is_recipe', 'title', 'description', 'prep_time', 'cook_time',
        'cool_time', 'chill_time', 'rest_time', 'marinate_time', 'soak_time',
        'total_time', 'servings', 'ingredients', 'steps', 'notes',
      ],
      additionalProperties: false,
    },
  },
};

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

const EXCEPTION_MESSAGES = [
  '🔌 Connection failed! Either the internet is down or that URL is playing hard to get.',
  '🌪️ Something went sideways. The bits got lost somewhere between here and there.',
  '🧊 Brr... that request went ice cold. Could not reach the server at all.',
  '🛸 The request disappeared into the void. Aliens? Maybe. Network error? Definitely.',
  '🔥 This is fine. Everything is fine. (It is not fine - we could not connect.)',
  '🐛 A wild bug appeared! Do not worry, we are on it. Probably.',
] as const;

const REMOVED_TAGS = ['script', 'style', 'noscript', 'svg', 'iframe', 'template'];
const STRUCTURAL_TAGS = ['header', 'footer', 'nav', 'aside', 'form'];

interface ChatGptParseResponse {
  success?: boolean;
  data?: unknown;
  error?: string;
}

type ParsedRecipe = Recipe & { is_recipe: boolean };

function getStatusErrorMessage(statusCode: number): string {
  return STATUS_MESSAGES[statusCode] ??
    DEFAULT_STATUS_MESSAGES[statusCode % DEFAULT_STATUS_MESSAGES.length];
}

function getExceptionErrorMessage(): string {
  return EXCEPTION_MESSAGES[Math.floor(Math.random() * EXCEPTION_MESSAGES.length)];
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

function decodeHtmlEntities(value: string): string {
  if (typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(value, 'text/html');
    return document.documentElement.textContent ?? value;
  }

  return value
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function removeTagBlocks(value: string, tagName: string): string {
  return value.replace(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, 'gi'), '\n');
}

function extractTitle(html: string, fallbackTitle: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1] ? decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim() : '';
  return title || fallbackTitle;
}

function extractVisibleText(html: string): string {
  let sanitized = html.replace(/<!--[\s\S]*?-->/g, ' ');

  for (const tagName of [...REMOVED_TAGS, ...STRUCTURAL_TAGS]) {
    sanitized = removeTagBlocks(sanitized, tagName);
  }

  sanitized = sanitized.replace(/<(?:br|hr)\s*\/?>/gi, '\n');
  sanitized = sanitized.replace(
    /<\/(?:address|article|blockquote|caption|dd|div|dl|dt|figcaption|figure|h[1-6]|li|main|ol|p|pre|section|table|tbody|td|th|thead|tr|ul)>/gi,
    '\n',
  );
  sanitized = sanitized.replace(/<[^>]+>/g, ' ');

  const lines = decodeHtmlEntities(sanitized)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line, index, allLines) => index === 0 || line !== allLines[index - 1]);

  return lines.join('\n');
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

async function extractRecipeWithChatGpt(rawText: string): Promise<{
  recipe: ParsedRecipe | null;
  errorResponse?: SummarizeResponse;
}> {
  if (!CHATGPT_API_KEY) {
    return {
      recipe: null,
      errorResponse: buildSummaryResponse(
        '🔐 Missing EXPO_PUBLIC_CHATGPT_API_KEY. Add a public API key to the Expo app before trying again.\n\n📋 Error code: 401',
        401,
      ),
    };
  }

  try {
    const response = await apiClient.post<ChatGptParseResponse>('/api/v1/chatgpt/parse', {
      text: rawText.slice(0, 12_000),
      system_prompt: RECIPE_SYSTEM_PROMPT,
      model: 'gpt-4o-mini',
      response_format: RECIPE_RESPONSE_FORMAT,
      temperature: 0.2,
      max_tokens: 2000,
    });

    if (response.data?.success) {
      return { recipe: normalizeRecipePayload(response.data.data) };
    }

    return { recipe: null };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const message =
        statusCode === 401
          ? '🔐 The public ChatGPT API key was rejected. Update EXPO_PUBLIC_CHATGPT_API_KEY and try again.'
          : getStatusErrorMessage(statusCode);

      return {
        recipe: null,
        errorResponse: buildSummaryResponse(`${message}\n\n📋 Error code: ${statusCode}`, statusCode),
      };
    }

    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      return {
        recipe: null,
        errorResponse: buildSummaryResponse(
          '⏰ The ChatGPT API timed out before it could finish parsing the recipe.\n\n📋 Error code: 408',
          408,
        ),
      };
    }

    return {
      recipe: null,
      errorResponse: buildSummaryResponse(
        '🔌 Could not reach the ChatGPT API. Make sure the Azure Function is running and reachable from this device.\n\n📋 Error code: CONNECTION_FAILED',
        0,
      ),
    };
  }
}

async function summarizeViaBackend(url: string): Promise<SummarizeResponse> {
  try {
    const response = await apiClient.post<ChatGptParseResponse>('/api/v1/chatgpt/parse-url', {
      url,
      system_prompt: RECIPE_SYSTEM_PROMPT,
      model: 'gpt-4o-mini',
      response_format: RECIPE_RESPONSE_FORMAT,
      temperature: 0.2,
      max_tokens: 2000,
    });

    if (response.data?.success) {
      const recipe = normalizeRecipePayload(response.data.data);
      if (recipe?.is_recipe) return { title: recipe.title, is_recipe: true, recipe };
      if (recipe && !recipe.is_recipe) return { title: recipe.title, is_recipe: false };
    }

    return buildSummaryResponse('🤔 Could not extract a recipe from that page.\n\n📋 Error code: PARSE_FAILED', 0);
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
      '🔌 Could not reach the backend. Make sure the Azure Function is running.\n\n📋 Error code: CONNECTION_FAILED',
      0,
    );
  }
}

/**
 * Recipe extraction endpoints.
 */
export const recipeApi = {
  /** Check if the ChatGPT extraction service is reachable. */
  async checkHealth(): Promise<HealthCheckResponse> {
    await apiClient.get('/api/health', { responseType: 'text' });
    return { status: 'healthy' };
  },

  /** Fetch a URL, extract readable text, and ask chatgpt_api for the recipe JSON. */
  async summarize(url: string): Promise<SummarizeResponse> {
    // On web browsers, direct cross-origin fetches are blocked by CORS.
    // Delegate the URL fetch to the backend which has no such restriction.
    if (Platform.OS === 'web') {
      return summarizeViaBackend(url);
    }

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
        timeout: 15_000,
        validateStatus: () => true,
        transformResponse: [(value) => value],
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (response.status !== 200) {
        return buildSummaryResponse(
          `${getStatusErrorMessage(response.status)}\n\n📋 Error code: ${response.status}`,
          response.status,
        );
      }

      const html = response.data;
      const title = extractTitle(html, url);
      const text = extractVisibleText(html);

      if (!text) {
        return buildSummaryResponse(
          '🫥 The page loaded, but there was not enough readable text to extract anything useful.\n\n📋 Error code: EMPTY_PAGE',
          0,
        );
      }

      const { recipe, errorResponse } = await extractRecipeWithChatGpt(text);
      if (errorResponse) {
        return errorResponse;
      }

      if (recipe?.is_recipe) {
        return {
          title: recipe.title,
          is_recipe: true,
          recipe,
        };
      }

      if (recipe && !recipe.is_recipe) {
        return {
          title: recipe.title,
          is_recipe: false,
        };
      }

      return {
        title,
        is_recipe: true,
        summary: text,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        return buildSummaryResponse(
          '⏰ The request timed out! That site is slower than a Monday morning.\n\n📋 Error code: TIMEOUT',
          408,
        );
      }

      if (axios.isAxiosError(error)) {
        return buildSummaryResponse(
          '🔌 Could not connect! Either the site is down or it is ghosting us.\n\n📋 Error code: CONNECTION_FAILED',
          0,
        );
      }

      return buildSummaryResponse(
        `${getExceptionErrorMessage()}\n\n📋 Error code: UNKNOWN\n🔍 Details: ${String(error)}`,
        -1,
      );
    }
  },
};
