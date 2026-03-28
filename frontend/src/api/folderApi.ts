import apiClient from './client';
import type { RecipeFolder } from '@/types/recipe';

export const folderApi = {
  async getFolders(): Promise<RecipeFolder[]> {
    const resp = await apiClient.get<{ folders: RecipeFolder[] }>('/api/v1/folders');
    return resp.data.folders;
  },

  async createFolder(name: string): Promise<RecipeFolder> {
    const resp = await apiClient.post<{ folder: RecipeFolder }>('/api/v1/folders', { name });
    return resp.data.folder;
  },

  async renameFolder(folderId: string, name: string): Promise<RecipeFolder> {
    const resp = await apiClient.put<{ folder: RecipeFolder }>(`/api/v1/folders/${folderId}`, { name });
    return resp.data.folder;
  },

  async deleteFolder(folderId: string): Promise<void> {
    await apiClient.delete(`/api/v1/folders/${folderId}`);
  },

  async moveRecipeToFolder(recipeId: string, folderId: string | null): Promise<void> {
    await apiClient.patch('/api/v1/folders/move', { recipeId, folderId });
  },
};
