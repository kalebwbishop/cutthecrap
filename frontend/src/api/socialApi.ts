import apiClient from './client';
import type { SavedRecipeSummary } from '@/types/recipe';

// ── Types ───────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  id: string;
  createdAt: string;
  user: UserSummary;
}

export interface Friend {
  friendshipId: string;
  createdAt: string;
  user: UserSummary;
}

export interface GroupSummary {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  role: string;
  memberCount: number;
  recipeCount: number;
}

export interface GroupDetail {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  role: string;
}

export interface GroupMember {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
}

export interface SharedRecipeSummary {
  shareId: string;
  sharedAt: string;
  recipe: {
    id: string;
    title: string;
    description?: string;
    sourceUrl?: string;
  };
  sharedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface SharedRecipeDetail {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  prepTime?: string;
  cookTime?: string;
  coolTime?: string;
  chillTime?: string;
  restTime?: string;
  marinateTime?: string;
  soakTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients: string[];
  steps: any[];
  notes?: string[];
  sharedAt: string;
  sharedBy: {
    name: string;
    avatarUrl?: string;
  };
}

// ── API ─────────────────────────────────────────────────────────────

export const socialApi = {
  // Friends
  async searchUsers(email: string): Promise<UserSummary[]> {
    const resp = await apiClient.get<{ users: UserSummary[] }>(
      `/api/v1/friends/search?email=${encodeURIComponent(email)}`
    );
    return resp.data.users;
  },

  async sendFriendRequest(email: string): Promise<void> {
    await apiClient.post('/api/v1/friends/request', { email });
  },

  async getFriends(): Promise<Friend[]> {
    const resp = await apiClient.get<{ friends: Friend[] }>('/api/v1/friends');
    return resp.data.friends;
  },

  async getFriendRequests(): Promise<FriendRequest[]> {
    const resp = await apiClient.get<{ requests: FriendRequest[] }>('/api/v1/friends/requests');
    return resp.data.requests;
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    const resp = await apiClient.get<{ requests: FriendRequest[] }>('/api/v1/friends/sent');
    return resp.data.requests;
  },

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    await apiClient.post(`/api/v1/friends/accept/${friendshipId}`);
  },

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    await apiClient.post(`/api/v1/friends/reject/${friendshipId}`);
  },

  async removeFriend(friendshipId: string): Promise<void> {
    await apiClient.delete(`/api/v1/friends/${friendshipId}`);
  },

  // Groups
  async createGroup(name: string): Promise<GroupSummary> {
    const resp = await apiClient.post<{ group: GroupSummary }>('/api/v1/groups', { name });
    return resp.data.group;
  },

  async getGroups(): Promise<GroupSummary[]> {
    const resp = await apiClient.get<{ groups: GroupSummary[] }>('/api/v1/groups');
    return resp.data.groups;
  },

  async getGroup(groupId: string): Promise<GroupDetail> {
    const resp = await apiClient.get<{ group: GroupDetail }>(`/api/v1/groups/${groupId}`);
    return resp.data.group;
  },

  async updateGroup(groupId: string, name: string): Promise<void> {
    await apiClient.put(`/api/v1/groups/${groupId}`, { name });
  },

  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/api/v1/groups/${groupId}`);
  },

  // Group Members
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const resp = await apiClient.get<{ members: GroupMember[] }>(`/api/v1/groups/${groupId}/members`);
    return resp.data.members;
  },

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    await apiClient.post(`/api/v1/groups/${groupId}/members`, { userId });
  },

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/groups/${groupId}/members/${userId}`);
  },

  // Shared Recipes
  async shareRecipe(groupId: string, recipeId: string): Promise<void> {
    await apiClient.post(`/api/v1/groups/${groupId}/recipes`, { recipeId });
  },

  async getGroupRecipes(groupId: string): Promise<SharedRecipeSummary[]> {
    const resp = await apiClient.get<{ recipes: SharedRecipeSummary[] }>(`/api/v1/groups/${groupId}/recipes`);
    return resp.data.recipes;
  },

  async getSharedRecipeDetail(groupId: string, recipeId: string): Promise<SharedRecipeDetail> {
    const resp = await apiClient.get<{ recipe: SharedRecipeDetail }>(`/api/v1/groups/${groupId}/recipes/${recipeId}`);
    return resp.data.recipe;
  },

  async saveSharedRecipe(groupId: string, recipeId: string): Promise<SavedRecipeSummary> {
    const resp = await apiClient.post<{ recipe: SavedRecipeSummary }>(`/api/v1/groups/${groupId}/recipes/${recipeId}/save`);
    return resp.data.recipe;
  },

  async unshareRecipe(groupId: string, shareId: string): Promise<void> {
    await apiClient.delete(`/api/v1/groups/${groupId}/recipes/${shareId}/unshare`);
  },
};
