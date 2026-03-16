import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Creates a simple Axios client pointed at the chatgpt_api Azure Function.
 * Uses EXPO_PUBLIC_CHATGPT_API_BASE or falls back to a sensible default.
 */
function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeBaseUrl(value: string): string {
  return stripTrailingSlash(
    value
      .trim()
      .replace(/\/api\/v1\/chatgpt\/parse$/i, '')
      .replace(/\/api\/health$/i, '')
      .replace(/\/api$/i, ''),
  );
}

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_CHATGPT_API_BASE;
  if (envUrl) return normalizeBaseUrl(envUrl);

  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:7071`;
    }
  }

  return Platform.OS === 'web' ? 'http://localhost:7071' : 'http://10.0.2.2:7071';
}

export const CHATGPT_API_BASE_URL = getBaseUrl();
export const CHATGPT_API_KEY = process.env.EXPO_PUBLIC_CHATGPT_API_KEY?.trim() ?? '';

const apiClient: AxiosInstance = axios.create({
  baseURL: CHATGPT_API_BASE_URL,
  timeout: 60_000, // Scraping + GPT can be slow
  headers: {
    'Content-Type': 'application/json',
    ...(CHATGPT_API_KEY ? { 'x-api-key': CHATGPT_API_KEY } : {}),
  },
});

export default apiClient;
