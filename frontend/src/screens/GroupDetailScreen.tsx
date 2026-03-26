import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useSocialStore } from '@/store/socialStore';
import { useAuthStore } from '@/store/authStore';
import { useRecipeStore } from '@/store/recipeStore';
import { recipeApi } from '@/api/recipeApi';
import { socialApi } from '@/api/socialApi';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';
import type { SavedRecipeSummary } from '@/types/recipe';

export default function GroupDetailScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const {
    activeGroup,
    activeGroupMembers,
    activeGroupRecipes,
    activeGroupLoading,
    loadGroupDetail,
    addMember,
    removeMember,
    shareRecipe,
    unshareRecipe,
    clearActiveGroup,
    friends,
    loadFriends,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<'recipes' | 'members'>('recipes');
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [myRecipes, setMyRecipes] = useState<SavedRecipeSummary[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroupDetail(groupId);
      loadFriends();
    }
    return () => clearActiveGroup();
  }, [groupId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/groups' as any);
  };

  const isAdmin = activeGroup?.role === 'admin';

  const handleInvite = async (userId: string) => {
    if (!groupId) return;
    try {
      await addMember(groupId, userId);
      setShowInvite(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to add member';
      showAlert(msg);
    }
  };

  const handleRemoveMember = (userId: string, name: string) => {
    if (!groupId) return;
    const isSelf = userId === currentUser?.id;
    const title = isSelf ? 'Leave Group' : 'Remove Member';
    const message = isSelf ? 'Leave this group?' : `Remove ${name} from this group?`;

    const doRemove = async () => {
      try {
        await removeMember(groupId, userId);
        if (isSelf) {
          router.replace('/groups' as any);
        }
      } catch (err: any) {
        showAlert(err?.response?.data?.error?.message || 'Failed to remove member');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) doRemove();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: isSelf ? 'Leave' : 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const handleOpenShareModal = async () => {
    setShowShare(true);
    setLoadingRecipes(true);
    try {
      const recipes = await recipeApi.getSavedRecipes();
      setMyRecipes(recipes);
    } catch {
      showAlert('Failed to load your recipes');
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleShare = async (recipeId: string) => {
    if (!groupId) return;
    try {
      await shareRecipe(groupId, recipeId);
      setShowShare(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to share recipe';
      showAlert(msg);
    }
  };

  const handleUnshare = (shareId: string) => {
    if (!groupId) return;
    const doUnshare = async () => {
      try {
        await unshareRecipe(groupId, shareId);
      } catch {
        showAlert('Failed to unshare recipe');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Remove this shared recipe?')) doUnshare();
    } else {
      Alert.alert('Unshare Recipe', 'Remove this shared recipe from the group?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doUnshare },
      ]);
    }
  };

  const handleViewRecipe = async (recipeId: string) => {
    if (!groupId) return;
    try {
      const detail = await socialApi.getSharedRecipeDetail(groupId, recipeId);
      const recipe = {
        title: detail.title,
        description: detail.description,
        prep_time: detail.prepTime,
        cook_time: detail.cookTime,
        cool_time: detail.coolTime,
        chill_time: detail.chillTime,
        rest_time: detail.restTime,
        marinate_time: detail.marinateTime,
        soak_time: detail.soakTime,
        total_time: detail.totalTime,
        servings: detail.servings,
        ingredients: detail.ingredients,
        steps: detail.steps,
        notes: detail.notes,
      };
      useRecipeStore.setState({
        result: { is_recipe: true, title: detail.title, recipe },
        url: detail.sourceUrl ?? '',
        error: null,
        isLoading: false,
        savedRecipeId: null,
      });
      router.push('/result');
    } catch {
      showAlert('Failed to load recipe');
    }
  };

  const handleSaveRecipe = async (recipeId: string) => {
    if (!groupId) return;
    try {
      await socialApi.saveSharedRecipe(groupId, recipeId);
      showAlert('Recipe saved to your collection!');
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'RECIPE_LIMIT_REACHED') {
        router.push('/upgrade');
      } else {
        showAlert(err?.response?.data?.error?.message || 'Failed to save recipe');
      }
    }
  };

  function showAlert(message: string) {
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert('', message);
  }

  // Filter friends not already in the group
  const invitableFriends = friends.filter(
    (f) => !activeGroupMembers.some((m) => m.id === f.user.id)
  );

  if (activeGroupLoading && !activeGroup) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={s.loader} color={colors.textMuted} />
      </SafeAreaView>
    );
  }

  if (!activeGroup) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={s.header}>
          <TouchableOpacity
            style={[s.backButton, { backgroundColor: colors.bgSubtle }]}
            onPress={handleBack}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>Group not found</Text>
          <View style={s.headerSpacer} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backButton, { backgroundColor: colors.bgSubtle }]}
          onPress={handleBack}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {activeGroup.name}
        </Text>
        <View style={s.headerSpacer} />
      </View>

      {/* Action buttons */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: colors.bgButton }]}
          onPress={handleOpenShareModal}
          activeOpacity={0.7}
        >
          <Text style={s.actionButtonText}>Share Recipe</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity
            style={[s.actionButton, { backgroundColor: colors.bgSubtle, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => setShowInvite(true)}
            activeOpacity={0.7}
          >
            <Text style={[s.actionButtonTextAlt, { color: colors.text }]}>Invite Friend</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[s.toggleRow, { backgroundColor: colors.bgSubtle, marginHorizontal: spacing.xxl }]}>
        <TouchableOpacity
          style={[s.toggleButton, activeTab === 'recipes' && [s.toggleActive, { backgroundColor: colors.background }]]}
          onPress={() => setActiveTab('recipes')}
          activeOpacity={0.7}
        >
          <Text style={[s.toggleText, { color: colors.textMuted }, activeTab === 'recipes' && { color: colors.text }]}>
            Recipes ({activeGroupRecipes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleButton, activeTab === 'members' && [s.toggleActive, { backgroundColor: colors.background }]]}
          onPress={() => setActiveTab('members')}
          activeOpacity={0.7}
        >
          <Text style={[s.toggleText, { color: colors.textMuted }, activeTab === 'members' && { color: colors.text }]}>
            Members ({activeGroupMembers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'recipes' ? (
          activeGroupRecipes.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.textMuted }]}>
              No shared recipes yet. Tap "Share Recipe" to add one!
            </Text>
          ) : (
            activeGroupRecipes.map((sr) => (
              <View key={sr.shareId} style={[s.recipeCard, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={s.recipeCardInfo}
                  onPress={() => handleViewRecipe(sr.recipe.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.recipeName, { color: colors.text }]}>{sr.recipe.title}</Text>
                  <Text style={[s.recipeMeta, { color: colors.textMuted }]}>
                    Shared by {sr.sharedBy.name} · {new Date(sr.sharedAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <View style={s.recipeActions}>
                  <TouchableOpacity
                    style={[s.saveButton, { backgroundColor: colors.bgButton }]}
                    onPress={() => handleSaveRecipe(sr.recipe.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  {(sr.sharedBy.id === currentUser?.id || isAdmin) && (
                    <TouchableOpacity
                      style={[s.unshareButton, { borderColor: colors.error }]}
                      onPress={() => handleUnshare(sr.shareId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.unshareText, { color: colors.error }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )
        ) : (
          <>
            {activeGroupMembers.map((m) => (
              <View key={m.id} style={[s.memberCard, { borderColor: colors.border }]}>
                <View style={s.memberInfo}>
                  <Text style={[s.memberName, { color: colors.text }]}>{m.name}</Text>
                  <Text style={[s.memberEmail, { color: colors.textMuted }]}>
                    {m.email} · {m.role}
                  </Text>
                </View>
                {(isAdmin && m.id !== currentUser?.id) || m.id === currentUser?.id ? (
                  <TouchableOpacity
                    style={[s.removeMemberButton, { borderColor: colors.border }]}
                    onPress={() => handleRemoveMember(m.id, m.name)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.removeMemberText, { color: m.id === currentUser?.id ? colors.error : colors.textMuted }]}>
                      {m.id === currentUser?.id ? 'Leave' : 'Remove'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Invite Friend Modal */}
      <Modal visible={showInvite} transparent animationType="fade" onRequestClose={() => setShowInvite(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Invite a Friend</Text>
            {invitableFriends.length === 0 ? (
              <Text style={[s.emptyText, { color: colors.textMuted }]}>
                All your friends are already in this group, or you have no friends to invite.
              </Text>
            ) : (
              <ScrollView style={s.modalList}>
                {invitableFriends.map((f) => (
                  <TouchableOpacity
                    key={f.friendshipId}
                    style={[s.inviteCard, { borderColor: colors.border }]}
                    onPress={() => handleInvite(f.user.id)}
                    activeOpacity={0.7}
                  >
                    <View style={s.inviteInfo}>
                      <Text style={[s.inviteName, { color: colors.text }]}>{f.user.name}</Text>
                      <Text style={[s.inviteEmail, { color: colors.textMuted }]}>{f.user.email}</Text>
                    </View>
                    <Text style={[s.inviteAction, { color: colors.bgButton }]}>+ Add</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={[s.modalCloseButton, { borderColor: colors.border }]}
              onPress={() => setShowInvite(false)}
              activeOpacity={0.7}
            >
              <Text style={[s.modalCloseText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Recipe Modal */}
      <Modal visible={showShare} transparent animationType="fade" onRequestClose={() => setShowShare(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Share a Recipe</Text>
            {loadingRecipes ? (
              <ActivityIndicator style={s.loader} color={colors.textMuted} />
            ) : myRecipes.length === 0 ? (
              <Text style={[s.emptyText, { color: colors.textMuted }]}>
                You have no saved recipes to share.
              </Text>
            ) : (
              <ScrollView style={s.modalList}>
                {myRecipes.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[s.shareCard, { borderColor: colors.border }]}
                    onPress={() => handleShare(r.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.shareName, { color: colors.text }]}>{r.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={[s.modalCloseButton, { borderColor: colors.border }]}
              onPress={() => setShowShare(false)}
              activeOpacity={0.7}
            >
              <Text style={[s.modalCloseText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md,
    },
    backButton: {
      width: 32, height: 32, borderRadius: radii.full,
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: fontSizes.xl, fontWeight: '600', flex: 1 },
    headerSpacer: { width: 32 },
    actions: {
      flexDirection: 'row', gap: spacing.sm,
      paddingHorizontal: spacing.xxl, paddingBottom: spacing.md,
      maxWidth: 768, width: '100%', alignSelf: 'center',
    },
    actionButton: {
      paddingHorizontal: spacing.lg, paddingVertical: 10,
      borderRadius: radii.md,
    },
    actionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: fontSizes.sm },
    actionButtonTextAlt: { fontWeight: '600', fontSize: fontSizes.sm },
    toggleRow: {
      flexDirection: 'row', marginBottom: spacing.sm,
      borderRadius: radii.md, padding: 3,
      maxWidth: 768 - spacing.xxl * 2, width: '100%', alignSelf: 'center',
    },
    toggleButton: { flex: 1, paddingVertical: 8, borderRadius: radii.md - 2, alignItems: 'center' },
    toggleActive: {},
    toggleText: { fontSize: fontSizes.sm, fontWeight: '600' },
    scrollContent: {
      paddingHorizontal: spacing.xxl, paddingBottom: 40,
      maxWidth: 768, width: '100%', alignSelf: 'center',
    },
    loader: { marginTop: spacing.xxl },
    emptyText: { fontSize: fontSizes.base, marginTop: spacing.lg, textAlign: 'center' },
    recipeCard: {
      paddingVertical: spacing.md, borderBottomWidth: 1,
    },
    recipeCardInfo: { marginBottom: spacing.sm },
    recipeName: { fontSize: fontSizes.base, fontWeight: '600' },
    recipeMeta: { fontSize: fontSizes.sm, marginTop: 4 },
    recipeActions: { flexDirection: 'row', gap: spacing.sm },
    saveButton: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.md },
    saveButtonText: { color: '#FFFFFF', fontSize: fontSizes.sm, fontWeight: '600' },
    unshareButton: {
      paddingHorizontal: spacing.md, paddingVertical: 6,
      borderRadius: radii.md, borderWidth: 1,
    },
    unshareText: { fontSize: fontSizes.sm, fontWeight: '600' },
    memberCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.md, borderBottomWidth: 1,
    },
    memberInfo: { flex: 1, marginRight: spacing.sm },
    memberName: { fontSize: fontSizes.base, fontWeight: '500' },
    memberEmail: { fontSize: fontSizes.sm, marginTop: 2 },
    removeMemberButton: {
      paddingHorizontal: spacing.md, paddingVertical: 6,
      borderRadius: radii.md, borderWidth: 1,
    },
    removeMemberText: { fontSize: fontSizes.sm, fontWeight: '600' },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
    },
    modalContent: {
      borderRadius: radii.lg, padding: spacing.xl,
      width: '100%', maxWidth: 400, maxHeight: '80%',
    },
    modalTitle: { fontSize: fontSizes.xl, fontWeight: '700', marginBottom: spacing.md },
    modalList: { maxHeight: 300 },
    inviteCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.md, borderBottomWidth: 1,
    },
    inviteInfo: { flex: 1 },
    inviteName: { fontSize: fontSizes.base, fontWeight: '500' },
    inviteEmail: { fontSize: fontSizes.sm, marginTop: 2 },
    inviteAction: { fontSize: fontSizes.sm, fontWeight: '700' },
    shareCard: { paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
    shareName: { fontSize: fontSizes.base, fontWeight: '500' },
    modalCloseButton: {
      marginTop: spacing.lg, paddingVertical: 10,
      borderRadius: radii.md, borderWidth: 1, alignItems: 'center',
    },
    modalCloseText: { fontSize: fontSizes.base, fontWeight: '600' },
  });
