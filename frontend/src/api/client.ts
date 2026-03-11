import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Creates a simple Axios client pointed at the recipe-scraper backend.
 * Uses EXPO_PUBLIC_RECIPE_API_URL or falls back to a sensible default.
 */
function getBaseUrl(): string {
  // Explicit env var takes priority
  const envUrl = process.env.EXPO_PUBLIC_RECIPE_API_URL;
  if (envUrl) return envUrl;

  // In development, derive from Expo's debugger host
  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:8000`;
    }
  }

  // Fallback
  return Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.0.2.2:8000';
}

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60_000, // Scraping + GPT can be slow
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
