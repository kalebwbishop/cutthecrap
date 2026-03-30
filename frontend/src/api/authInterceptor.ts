import apiClient from './client';
import { authApi } from './authApi';
import { useAuthStore } from '@/store/authStore';
import { tokenStorage } from '@/utils/tokenStorage';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];
let interceptorSetUp = false;

function processQueue(error: unknown | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

/**
 * Registers a response interceptor on the API client that silently refreshes
 * expired access tokens using the stored refresh token. Concurrent 401s are
 * queued so only one refresh request is made at a time.
 *
 * Safe to call multiple times — the interceptor is only registered once.
 */
export function setupAuthInterceptor() {
  if (interceptorSetUp) return;
  interceptorSetUp = true;

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Don't intercept auth endpoints to avoid infinite refresh loops
      if (originalRequest?.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      if (error.response?.status !== 401 || originalRequest?._retry) {
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        useAuthStore.getState().handleSessionExpired();
        return Promise.reject(error);
      }

      try {
        const tokens = await authApi.refresh(refreshToken);
        const newAccessToken = tokens.accessToken;
        const newRefreshToken = tokens.refreshToken ?? refreshToken;

        // Update store and default header
        apiClient.defaults.headers.common['Authorization'] =
          `Bearer ${newAccessToken}`;
        useAuthStore.setState({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
        await tokenStorage.saveTokens(newAccessToken, newRefreshToken);

        // Retry all queued requests with the new token
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().handleSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
