import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Axios client pointed at the Cut The Crap FastAPI backend.
 * Uses EXPO_PUBLIC_API_BASE or falls back to a sensible default.
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
  const envUrl = process.env.EXPO_PUBLIC_API_BASE;
  if (envUrl) return normalizeBaseUrl(envUrl);

  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:8000`;
    }
  }

  return Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.0.2.2:8000';
}

export const API_BASE_URL = getBaseUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000, // Scraping + GPT can be slow
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
