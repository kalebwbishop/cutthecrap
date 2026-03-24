import apiClient from './client';

interface User {
  id: string;
  workosUserId: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExchangeResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

interface MeResponse {
  user: User;
}

export const authApi = {
  /** Get the WorkOS authorization URL from the backend. */
  async getLoginUrl(redirectUri?: string): Promise<string> {
    const params = redirectUri ? { redirect_uri: redirectUri } : {};
    const resp = await apiClient.get<{ authorizationUrl: string }>(
      '/api/v1/auth/login',
      { params },
    );
    return resp.data.authorizationUrl;
  },

  /** Exchange an authorization code for user + tokens. */
  async exchange(code: string): Promise<ExchangeResponse> {
    const resp = await apiClient.post<ExchangeResponse>('/api/v1/auth/exchange', {
      data: { code },
    });
    return resp.data;
  },

  /** Refresh the access token. */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const resp = await apiClient.post<RefreshResponse>('/api/v1/auth/refresh', {
      refreshToken,
    });
    return resp.data;
  },

  /** Get the current user profile. */
  async me(): Promise<User> {
    const resp = await apiClient.get<MeResponse>('/api/v1/auth/me');
    return resp.data.user;
  },

  /** Log out the current user and return the WorkOS logout URL. */
  async logout(): Promise<string | null> {
    const resp = await apiClient.post<{ logoutUrl?: string }>('/api/v1/auth/logout');
    return resp.data.logoutUrl ?? null;
  },
};

export type { User };
