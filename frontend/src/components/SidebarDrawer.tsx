import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import {
  CloseIcon,
  MailIcon,
  TrashIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  EditIcon,
  MoveIcon,
} from '@/components/Icons';
import { useAuthStore } from '@/store/authStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { recipeApi } from '@/api/recipeApi';
import { folderApi } from '@/api/folderApi';
import { useRouter } from 'expo-router';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';
import type { SavedRecipeSummary, RecipeFolder } from '@/types/recipe';

const DRAWER_WIDTH = 300;

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const openSavedRecipe = useRecipeStore((s) => s.openSavedRecipe);
  const openHistoryRecipe = useRecipeStore((s) => s.openHistoryRecipe);
  const isPro = useSubscriptionStore((s) => s.isPro);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeSummary[]>([]);
  const [historyRecipes, setHistoryRecipes] = useState<SavedRecipeSummary[]>([]);
  const [folders, setFolders] = useState<RecipeFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [hoveredRecipeId, setHoveredRecipeId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Folder management modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename'>('create');
  const [folderModalName, setFolderModalName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderModalError, setFolderModalError] = useState('');

  // Move-to-folder modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingRecipeId, setMovingRecipeId] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setRecipesLoading(true);
    try {
      if (activeTab === 'saved') {
        const [recipes, flds] = await Promise.all([
          recipeApi.getSavedRecipes(),
          folderApi.getFolders(),
        ]);
        setSavedRecipes(recipes);
        setFolders(flds);
      } else {
        const recipes = await recipeApi.getRecipeHistory();
        setHistoryRecipes(recipes);
      }
    } catch {
      // Silently fail — sidebar still shows user info
    } finally {
      setRecipesLoading(false);
    }
  }, [user, activeTab]);

  // Animate open/close and fetch recipes when opening
  useEffect(() => {
    if (visible) {
      fetchRecipes();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim, fetchRecipes]);

  const handleOpenRecipe = async (id: string) => {
    onClose();
    if (activeTab === 'saved') {
      await openSavedRecipe(id);
      router.push({ pathname: '/result', params: { savedRecipeId: id } });
    } else {
      await openHistoryRecipe(id);
      router.push({ pathname: '/result', params: { historyRecipeId: id } });
    }
  };

  const handleDeleteRecipe = (id: string) => {
    if (activeTab === 'saved') {
      setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
    } else {
      setHistoryRecipes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  const handleUpgrade = () => {
    onClose();
    if (isPro) {
      router.push('/customer-center');
    } else {
      router.push('/upgrade');
    }
  };

  // ── Folder helpers ──────────────────────────────────────────────────

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const openCreateFolderModal = () => {
    setFolderModalMode('create');
    setFolderModalName('');
    setFolderModalError('');
    setEditingFolderId(null);
    setShowFolderModal(true);
  };

  const openRenameFolderModal = (folder: RecipeFolder) => {
    setFolderModalMode('rename');
    setFolderModalName(folder.name);
    setFolderModalError('');
    setEditingFolderId(folder.id);
    setShowFolderModal(true);
  };

  const handleFolderModalSubmit = async () => {
    const name = folderModalName.trim();
    if (!name) {
      setFolderModalError('Folder name is required');
      return;
    }
    try {
      if (folderModalMode === 'create') {
        const folder = await folderApi.createFolder(name);
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (editingFolderId) {
        const folder = await folderApi.renameFolder(editingFolderId, name);
        setFolders((prev) =>
          prev.map((f) => (f.id === editingFolderId ? folder : f)).sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setShowFolderModal(false);
    } catch (e: any) {
      const msg = e?.response?.data?.error;
      setFolderModalError(typeof msg === 'string' ? msg : 'Something went wrong');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await folderApi.deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      // Recipes in deleted folder become uncategorized
      setSavedRecipes((prev) =>
        prev.map((r) => (r.folderId === folderId ? { ...r, folderId: null } : r)),
      );
    } catch {
      // Silently fail
    }
  };

  const openMoveModal = (recipeId: string) => {
    setMovingRecipeId(recipeId);
    setShowMoveModal(true);
  };

  const handleMoveRecipe = async (folderId: string | null) => {
    if (!movingRecipeId) return;
    try {
      await folderApi.moveRecipeToFolder(movingRecipeId, folderId);
      setSavedRecipes((prev) =>
        prev.map((r) => (r.id === movingRecipeId ? { ...r, folderId } : r)),
      );
      // Update folder counts
      setFolders((prev) =>
        prev.map((f) => {
          let count = f.recipeCount;
          const oldFolder = savedRecipes.find((r) => r.id === movingRecipeId)?.folderId;
          if (oldFolder === f.id) count--;
          if (folderId === f.id) count++;
          return { ...f, recipeCount: Math.max(0, count) };
        }),
      );
    } catch {
      // Silently fail
    }
    setShowMoveModal(false);
    setMovingRecipeId(null);
  };

  // ── Derived data ────────────────────────────────────────────────────

  const uncategorizedRecipes = useMemo(
    () => savedRecipes.filter((r) => !r.folderId),
    [savedRecipes],
  );

  const recipesByFolder = useMemo(() => {
    const map = new Map<string, SavedRecipeSummary[]>();
    for (const r of savedRecipes) {
      if (r.folderId) {
        const list = map.get(r.folderId) || [];
        list.push(r);
        map.set(r.folderId, list);
      }
    }
    return map;
  }, [savedRecipes]);

  // ── Recipe row renderer ─────────────────────────────────────────────

  const renderRecipeItem = (recipe: SavedRecipeSummary, showMove = false) => (
    <Pressable
      key={recipe.id}
      style={({ pressed }) => [s.recipeItem, pressed && { opacity: 0.7 }]}
      onPress={() => handleOpenRecipe(recipe.id)}
      onHoverIn={() => setHoveredRecipeId(recipe.id)}
      onHoverOut={() => setHoveredRecipeId(null)}
    >
      <View style={s.recipeItemRow}>
        <View style={s.recipeItemText}>
          <Text style={s.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
          {recipe.createdAt ? (
            <Text style={s.recipeDate}>
              {new Date(recipe.createdAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
        {(Platform.OS !== 'web' || hoveredRecipeId === recipe.id) && (
          <View style={s.recipeActions}>
            {showMove && activeTab === 'saved' && (
              <TouchableOpacity
                onPress={() => openMoveModal(recipe.id)}
                hitSlop={8}
                activeOpacity={0.7}
                style={s.trashButton}
              >
                <MoveIcon size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleDeleteRecipe(recipe.id)}
              hitSlop={8}
              activeOpacity={0.7}
              style={s.trashButton}
            >
              <TrashIcon size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Pressable>
  );

  // Don't render anything until user is known
  if (!user) return null;

  return (
    <View style={[s.root, !visible && s.rootHidden]} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay */}
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={s.overlayTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerInfo}>
            <Text style={s.userName} numberOfLines={1}>{user.name || user.email}</Text>
            <Text style={s.userEmail} numberOfLines={1}>{user.email}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={8} activeOpacity={0.7}>
            <CloseIcon size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* Saved / History toggle */}
        <View style={s.toggleRow}>
          <TouchableOpacity
            style={[s.toggleButton, activeTab === 'saved' && s.toggleButtonActive]}
            onPress={() => setActiveTab('saved')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleText, activeTab === 'saved' && s.toggleTextActive]}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleButton, activeTab === 'history' && s.toggleButtonActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleText, activeTab === 'history' && s.toggleTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Recipe list */}
        <ScrollView style={s.recipeList} contentContainerStyle={s.recipeListContent}>
          {recipesLoading ? (
            <Text style={s.emptyText}>Loading…</Text>
          ) : activeTab === 'history' ? (
            // History tab — flat list, no folders
            historyRecipes.length === 0 ? (
              <Text style={s.emptyText}>No recent recipes yet.</Text>
            ) : (
              historyRecipes.map((recipe) => renderRecipeItem(recipe))
            )
          ) : savedRecipes.length === 0 && folders.length === 0 ? (
            <Text style={s.emptyText}>No saved recipes yet.</Text>
          ) : (
            <>
              {/* Folders */}
              {folders.map((folder) => {
                const isExpanded = expandedFolders.has(folder.id);
                const folderRecipes = recipesByFolder.get(folder.id) || [];
                return (
                  <View key={folder.id}>
                    <Pressable
                      style={s.folderHeader}
                      onPress={() => toggleFolder(folder.id)}
                    >
                      <View style={s.folderHeaderLeft}>
                        {isExpanded
                          ? <ChevronDownIcon size={16} color={colors.textMuted} />
                          : <ChevronRightIcon size={16} color={colors.textMuted} />}
                        <FolderIcon size={16} color={colors.textMuted} />
                        <Text style={s.folderName} numberOfLines={1}>{folder.name}</Text>
                        <Text style={s.folderCount}>({folderRecipes.length})</Text>
                      </View>
                      <View style={s.folderActions}>
                        <TouchableOpacity
                          onPress={() => openRenameFolderModal(folder)}
                          hitSlop={6}
                          activeOpacity={0.7}
                        >
                          <EditIcon size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteFolder(folder.id)}
                          hitSlop={6}
                          activeOpacity={0.7}
                        >
                          <TrashIcon size={14} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                    {isExpanded && (
                      <View style={s.folderContent}>
                        {folderRecipes.length === 0 ? (
                          <Text style={[s.emptyText, { paddingVertical: spacing.sm }]}>No recipes in this folder.</Text>
                        ) : (
                          folderRecipes.map((recipe) => renderRecipeItem(recipe, true))
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Uncategorized recipes */}
              {uncategorizedRecipes.length > 0 && (
                <>
                  {folders.length > 0 && (
                    <Text style={s.uncategorizedLabel}>Uncategorized</Text>
                  )}
                  {uncategorizedRecipes.map((recipe) => renderRecipeItem(recipe, true))}
                </>
              )}
            </>
          )}

          {/* Create folder button — always visible inside scroll on Saved tab */}
          {activeTab === 'saved' && (
            <TouchableOpacity
              style={s.createFolderButton}
              onPress={openCreateFolderModal}
              activeOpacity={0.7}
            >
              <PlusIcon size={16} color={colors.textMuted} />
              <Text style={s.createFolderText}>New Folder</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Footer actions */}
        <View style={s.footer}>
          <View style={s.divider} />
          <TouchableOpacity style={isPro ? s.manageButton : s.upgradeButton} onPress={handleUpgrade} activeOpacity={0.7}>
            <Text style={isPro ? s.manageText : s.upgradeText}>
              {isPro ? 'Manage Subscription' : 'Upgrade'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={s.logoutText}>Log out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteAccountButton} onPress={() => setShowDeleteModal(true)} activeOpacity={0.7}>
            <TrashIcon size={16} color={colors.error} />
            <Text style={s.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.feedbackButton}
            onPress={() => { onClose(); router.push('/feedback'); }}
            activeOpacity={0.7}
          >
            <MailIcon size={16} color={colors.textMuted} />
            <Text style={s.feedbackText}>Send Feedback</Text>
          </TouchableOpacity>
          <View style={s.legalRow}>
            <TouchableOpacity onPress={() => { onClose(); router.push('/terms'); }} activeOpacity={0.7}>
              <Text style={s.legalText}>Terms</Text>
            </TouchableOpacity>
            <Text style={s.legalSeparator}>·</Text>
            <TouchableOpacity onPress={() => { onClose(); router.push('/privacy'); }} activeOpacity={0.7}>
              <Text style={s.legalText}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Delete account confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Delete Account?</Text>
            <Text style={s.modalBody}>
              This will permanently delete your account and all saved recipes. This action cannot be undone.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalDeleteButton, isDeleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={s.modalDeleteText}>{isDeleting ? 'Deleting…' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create / Rename folder modal */}
      <Modal visible={showFolderModal} transparent animationType="fade" onRequestClose={() => setShowFolderModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {folderModalMode === 'create' ? 'New Folder' : 'Rename Folder'}
            </Text>
            <TextInput
              style={s.folderInput}
              value={folderModalName}
              onChangeText={(t) => { setFolderModalName(t); setFolderModalError(''); }}
              placeholder="Folder name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={255}
              onSubmitEditing={handleFolderModalSubmit}
            />
            {folderModalError ? (
              <Text style={s.folderInputError}>{folderModalError}</Text>
            ) : null}
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelButton}
                onPress={() => setShowFolderModal(false)}
                activeOpacity={0.7}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.folderSubmitButton}
                onPress={handleFolderModalSubmit}
                activeOpacity={0.7}
              >
                <Text style={s.folderSubmitText}>
                  {folderModalMode === 'create' ? 'Create' : 'Rename'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move to folder modal */}
      <Modal visible={showMoveModal} transparent animationType="fade" onRequestClose={() => setShowMoveModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Move to Folder</Text>
            <ScrollView style={s.moveList}>
              <TouchableOpacity
                style={s.moveOption}
                onPress={() => handleMoveRecipe(null)}
                activeOpacity={0.7}
              >
                <Text style={s.moveOptionText}>Uncategorized</Text>
              </TouchableOpacity>
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={s.moveOption}
                  onPress={() => handleMoveRecipe(folder.id)}
                  activeOpacity={0.7}
                >
                  <FolderIcon size={16} color={colors.textMuted} />
                  <Text style={s.moveOptionText}>{folder.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[s.modalCancelButton, { marginTop: spacing.sm }]}
              onPress={() => setShowMoveModal(false)}
              activeOpacity={0.7}
            >
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
    },
    rootHidden: {
      pointerEvents: 'none',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.sidebarOverlay,
    },
    overlayTouch: {
      flex: 1,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.sidebarBg,
      paddingTop: Platform.OS === 'ios' ? 54 : 40,
      ...(Platform.OS === 'web'
        ? { boxShadow: '2px 0 12px rgba(0,0,0,0.15)' as any }
        : { elevation: 16 }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    userName: {
      fontSize: fontSizes['2xl'],
      fontWeight: '700',
      color: colors.text,
    },
    userEmail: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.sidebarDivider,
      marginHorizontal: spacing.lg,
    },
    toggleRow: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: colors.sidebarDivider,
      padding: 3,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: radii.md - 2,
      alignItems: 'center',
    },
    toggleButtonActive: {
      backgroundColor: colors.sidebarBg,
    },
    toggleText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.textMuted,
    },
    toggleTextActive: {
      color: colors.text,
    },
    sectionTitle: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    recipeList: {
      flex: 1,
    },
    recipeListContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    recipeItem: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.sidebarDivider,
    },
    recipeItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    recipeItemText: {
      flex: 1,
      marginRight: spacing.sm,
    },
    trashButton: {
      padding: spacing.xs,
    },
    recipeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    recipeTitle: {
      fontSize: fontSizes.base,
      fontWeight: '500',
      color: colors.sidebarRecipeTitle,
    },
    recipeDate: {
      fontSize: fontSizes.xs,
      color: colors.sidebarRecipeSubtitle,
      marginTop: 2,
    },
    emptyText: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      paddingVertical: spacing.lg,
    },
    folderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingTop: spacing.md,
    },
    folderHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 4,
    },
    folderName: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    folderCount: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginLeft: 2,
    },
    folderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    folderContent: {
      paddingLeft: spacing.md,
    },
    uncategorizedLabel: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.textMuted,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    createFolderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.sidebarDivider,
    },
    createFolderText: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      fontWeight: '500',
    },
    folderInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSizes.base,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    folderInputError: {
      fontSize: fontSizes.sm,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    folderSubmitButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: colors.bgButton,
      alignItems: 'center',
    },
    folderSubmitText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    moveList: {
      maxHeight: 250,
      marginBottom: spacing.sm,
    },
    moveOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.sidebarDivider,
    },
    moveOptionText: {
      fontSize: fontSizes.base,
      color: colors.text,
    },
    footer: {
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    },
    upgradeButton: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: colors.bgButton,
      alignItems: 'center',
    },
    upgradeText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    manageButton: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingVertical: 10,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    manageText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
    logoutButton: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      paddingVertical: 10,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    logoutText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
    deleteAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      paddingVertical: 10,
      gap: spacing.sm,
    },
    deleteAccountText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.error,
    },
    feedbackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      paddingVertical: 10,
      gap: spacing.sm,
    },
    feedbackText: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    legalRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xs,
      gap: spacing.sm,
    },
    legalText: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    legalSeparator: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    navButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      marginTop: spacing.xs,
    },
    navText: {
      fontSize: fontSizes.base,
      fontWeight: '500',
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: radii.lg,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 340,
    },
    modalTitle: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    modalBody: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
    modalDeleteButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    modalDeleteText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
