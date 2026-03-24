import apiClient from './client';

export const feedbackApi = {
  async sendFeedback(message: string): Promise<{ success: boolean; message: string }> {
    const resp = await apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/feedback/send',
      { message },
    );
    return resp.data;
  },
};
