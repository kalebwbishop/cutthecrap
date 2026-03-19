import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import apiClient from '@/api/client';
import { authApi, User } from '@/api/authApi';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  /** Kick off the WorkOS login flow (opens browser). */
  login: () => Promise<void>;

  /** Exchange an authorization code for tokens + user. */
  handleAuthCode: (code: string) => Promise<void>;

  /** Log out and clear tokens. */
  logout: () => Promise<void>;

  /** Attempt to restore the session from a stored refresh token. */
  restoreSession: () => Promise<void>;
}

function setAuthHeader(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,

  login: async () => {
    try {
      // Build a redirect URI the backend callback will send the code to.
      // On native this is the deep-link scheme; on web the current origin.
      const redirectUri =
        Platform.OS === 'web'
          ? `${window.location.origin}/auth`
          : Linking.createURL('auth');

      const authorizationUrl = await authApi.getLoginUrl(redirectUri);

      if (Platform.OS === 'web') {
        window.location.href = authorizationUrl;
      } else {
        await Linking.openURL(authorizationUrl);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  },

  handleAuthCode: async (code: string) => {
    set({ isLoading: true });
    try {
      const { user, accessToken, refreshToken } = await authApi.exchange(code);
      setAuthHeader(accessToken);
      set({ user, accessToken, refreshToken: refreshToken ?? null, isLoading: false });
    } catch (err) {
      console.error('Token exchange failed:', err);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const { accessToken } = get();
      if (accessToken) {
        await authApi.logout().catch(() => {});
      }
    } finally {
      setAuthHeader(null);
      set({ user: null, accessToken: null, refreshToken: null });
    }
  },

  restoreSession: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return;

    set({ isLoading: true });
    try {
      const tokens = await authApi.refresh(refreshToken);
      setAuthHeader(tokens.accessToken);

      const user = await authApi.me();
      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? refreshToken,
        isLoading: false,
      });
    } catch {
      // Refresh failed — clear everything
      setAuthHeader(null);
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },
}));
