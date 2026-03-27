import { create } from 'zustand';
import {
  socialApi,
  Friend,
  FriendRequest,
  GroupSummary,
  GroupDetail,
  GroupMember,
  SharedRecipeSummary,
} from '@/api/socialApi';

interface SocialState {
  // Friends
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendsLoading: boolean;

  // Groups
  groups: GroupSummary[];
  groupsLoading: boolean;

  // Active group detail
  activeGroup: GroupDetail | null;
  activeGroupMembers: GroupMember[];
  activeGroupRecipes: SharedRecipeSummary[];
  activeGroupLoading: boolean;

  // Actions — Friends
  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  sendFriendRequest: (email: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  rejectRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;

  // Actions — Groups
  loadGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;

  // Actions — Active Group
  loadGroupDetail: (groupId: string) => Promise<void>;
  addMember: (groupId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  shareRecipe: (groupId: string, recipeId: string) => Promise<void>;
  unshareRecipe: (groupId: string, shareId: string) => Promise<void>;
  clearActiveGroup: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  friendsLoading: false,

  groups: [],
  groupsLoading: false,

  activeGroup: null,
  activeGroupMembers: [],
  activeGroupRecipes: [],
  activeGroupLoading: false,

  // ── Friends ─────────────────────────────────────────────────────

  loadFriends: async () => {
    set({ friendsLoading: true });
    try {
      const [friends, requests, sent] = await Promise.all([
        socialApi.getFriends(),
        socialApi.getFriendRequests(),
        socialApi.getSentRequests(),
      ]);
      set({ friends, friendRequests: requests, sentRequests: sent });
    } catch (err) {
      if (__DEV__) console.error('Failed to load friends:', err);
    } finally {
      set({ friendsLoading: false });
    }
  },

  loadFriendRequests: async () => {
    try {
      const [requests, sent] = await Promise.all([
        socialApi.getFriendRequests(),
        socialApi.getSentRequests(),
      ]);
      set({ friendRequests: requests, sentRequests: sent });
    } catch (err) {
      if (__DEV__) console.error('Failed to load friend requests:', err);
    }
  },

  sendFriendRequest: async (email: string) => {
    await socialApi.sendFriendRequest(email);
    await get().loadFriendRequests();
  },

  acceptRequest: async (friendshipId: string) => {
    await socialApi.acceptFriendRequest(friendshipId);
    set((s) => ({
      friendRequests: s.friendRequests.filter((r) => r.id !== friendshipId),
    }));
    await get().loadFriends();
  },

  rejectRequest: async (friendshipId: string) => {
    await socialApi.rejectFriendRequest(friendshipId);
    set((s) => ({
      friendRequests: s.friendRequests.filter((r) => r.id !== friendshipId),
    }));
  },

  removeFriend: async (friendshipId: string) => {
    await socialApi.removeFriend(friendshipId);
    set((s) => ({
      friends: s.friends.filter((f) => f.friendshipId !== friendshipId),
    }));
  },

  // ── Groups ──────────────────────────────────────────────────────

  loadGroups: async () => {
    set({ groupsLoading: true });
    try {
      const groups = await socialApi.getGroups();
      set({ groups });
    } catch (err) {
      if (__DEV__) console.error('Failed to load groups:', err);
    } finally {
      set({ groupsLoading: false });
    }
  },

  createGroup: async (name: string) => {
    await socialApi.createGroup(name);
    await get().loadGroups();
  },

  deleteGroup: async (groupId: string) => {
    await socialApi.deleteGroup(groupId);
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
      activeGroup: s.activeGroup?.id === groupId ? null : s.activeGroup,
    }));
  },

  // ── Active Group ────────────────────────────────────────────────

  loadGroupDetail: async (groupId: string) => {
    set({ activeGroupLoading: true });
    try {
      const [group, members, recipes] = await Promise.all([
        socialApi.getGroup(groupId),
        socialApi.getGroupMembers(groupId),
        socialApi.getGroupRecipes(groupId),
      ]);
      set({
        activeGroup: group,
        activeGroupMembers: members,
        activeGroupRecipes: recipes,
      });
    } catch (err) {
      if (__DEV__) console.error('Failed to load group detail:', err);
    } finally {
      set({ activeGroupLoading: false });
    }
  },

  addMember: async (groupId: string, userId: string) => {
    await socialApi.addGroupMember(groupId, userId);
    await get().loadGroupDetail(groupId);
  },

  removeMember: async (groupId: string, userId: string) => {
    await socialApi.removeGroupMember(groupId, userId);
    await get().loadGroupDetail(groupId);
  },

  shareRecipe: async (groupId: string, recipeId: string) => {
    await socialApi.shareRecipe(groupId, recipeId);
    // Reload recipes for the active group
    const recipes = await socialApi.getGroupRecipes(groupId);
    set({ activeGroupRecipes: recipes });
  },

  unshareRecipe: async (groupId: string, shareId: string) => {
    await socialApi.unshareRecipe(groupId, shareId);
    set((s) => ({
      activeGroupRecipes: s.activeGroupRecipes.filter((r) => r.shareId !== shareId),
    }));
  },

  clearActiveGroup: () => {
    set({
      activeGroup: null,
      activeGroupMembers: [],
      activeGroupRecipes: [],
    });
  },
}));
