import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '@/api/client';
import { authApi, User } from '@/api/authApi';
import { tokenStorage } from '@/utils/tokenStorage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  sessionExpiredMessage: string | null;

  /** Kick off the WorkOS login flow (opens browser). */
  login: () => Promise<void>;

  /** Exchange an authorization code for tokens + user. */
  handleAuthCode: (code: string) => Promise<void>;

  /** Log out and clear tokens. */
  logout: () => Promise<void>;

  /** Permanently delete the user's account and clear all local state. */
  deleteAccount: () => Promise<void>;

  /** Attempt to restore the session from a stored refresh token. */
  restoreSession: () => Promise<void>;

  /** Called when the session cannot be refreshed. Clears auth state and sets an expiry message. */
  handleSessionExpired: () => void;

  /** Dismiss the session-expired message. */
  clearSessionExpiredMessage: () => void;
}

function setAuthHeader(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Track the last exchanged code to prevent duplicate exchange attempts.
  // On mobile, both WebBrowser.openAuthSessionAsync and the deep-link route
  // can trigger handleAuthCode for the same code simultaneously.
  let lastExchangedCode: string | null = null;

  return {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  sessionExpiredMessage: null,

  login: async () => {
    try {
      const redirectUri =
        Platform.OS === 'web'
          ? `${window.location.origin}/auth`
          : Linking.createURL('auth');

      const authorizationUrl = await authApi.getLoginUrl(redirectUri);

      if (Platform.OS === 'web') {
        window.location.href = authorizationUrl;
      } else {
        // In-app browser returns the redirect URL with the auth code
        const result = await WebBrowser.openAuthSessionAsync(
          authorizationUrl,
          redirectUri,
        );

        if (result.type === 'success' && result.url) {
          const params = Linking.parse(result.url);
          const code = params.queryParams?.code;
          if (typeof code === 'string') {
            await get().handleAuthCode(code);
          }
        }
      }
    } catch (err) {
      if (__DEV__) console.error('Login failed:', err);
    }
  },

  handleAuthCode: async (code: string) => {
    if (code === lastExchangedCode) return;
    lastExchangedCode = code;
    set({ isLoading: true });
    try {
      const { user, accessToken, refreshToken } = await authApi.exchange(code);
      setAuthHeader(accessToken);
      await tokenStorage.saveTokens(accessToken, refreshToken ?? null);
      set({ user, accessToken, refreshToken: refreshToken ?? null, isLoading: false });
    } catch (err) {
      if (__DEV__) console.error('Token exchange failed:', err);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    let logoutUrl: string | null = null;
    try {
      const { accessToken } = get();
      if (accessToken) {
        logoutUrl = await authApi.logout().catch(() => null);
      }
    } finally {
      setAuthHeader(null);
      await tokenStorage.clearTokens();
      set({ user: null, accessToken: null, refreshToken: null });

      if (logoutUrl) {
        if (Platform.OS === 'web') {
          window.location.href = logoutUrl;
        } else {
          await WebBrowser.openAuthSessionAsync(logoutUrl, Linking.createURL(''));
        }
      }
    }
  },

  deleteAccount: async () => {
    await authApi.deleteAccount();
    setAuthHeader(null);
    await tokenStorage.clearTokens();
    set({ user: null, accessToken: null, refreshToken: null });
  },

  restoreSession: async () => {
    const storedRefreshToken = await tokenStorage.getRefreshToken();
    const refreshToken = get().refreshToken ?? storedRefreshToken;
    if (!refreshToken) return;

    set({ isLoading: true });
    try {
      const tokens = await authApi.refresh(refreshToken);
      setAuthHeader(tokens.accessToken);

      const newRefreshToken = tokens.refreshToken ?? refreshToken;
      await tokenStorage.saveTokens(tokens.accessToken, newRefreshToken);

      const user = await authApi.me();
      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: newRefreshToken,
        isLoading: false,
      });
    } catch {
      // Refresh failed — session is no longer valid
      await tokenStorage.clearTokens();
      get().handleSessionExpired();
    }
  },

  handleSessionExpired: () => {
    const wasLoggedIn = !!get().user;
    setAuthHeader(null);
    tokenStorage.clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      // Only surface a message when the user had an active session
      sessionExpiredMessage: wasLoggedIn
        ? 'Your session expired. Please sign in again.'
        : null,
    });
  },

  clearSessionExpiredMessage: () => {
    set({ sessionExpiredMessage: null });
  },
};
});
