import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { CloseIcon } from '@/components/Icons';
import { useAuthStore } from '@/store/authStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { recipeApi } from '@/api/recipeApi';
import { useRouter } from 'expo-router';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';
import type { SavedRecipeSummary } from '@/types/recipe';

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
  const openSavedRecipe = useRecipeStore((s) => s.openSavedRecipe);
  const openHistoryRecipe = useRecipeStore((s) => s.openHistoryRecipe);
  const isPro = useSubscriptionStore((s) => s.isPro);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeSummary[]>([]);
  const [historyRecipes, setHistoryRecipes] = useState<SavedRecipeSummary[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setRecipesLoading(true);
    try {
      if (activeTab === 'saved') {
        const recipes = await recipeApi.getSavedRecipes();
        setSavedRecipes(recipes);
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
    } else {
      await openHistoryRecipe(id);
    }
    router.push('/result');
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleUpgrade = () => {
    onClose();
    if (isPro) {
      router.push('/customer-center');
    } else {
      router.push('/paywall');
    }
  };

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
          ) : (activeTab === 'saved' ? savedRecipes : historyRecipes).length === 0 ? (
            <Text style={s.emptyText}>
              {activeTab === 'saved' ? 'No saved recipes yet.' : 'No recent recipes yet.'}
            </Text>
          ) : (
            (activeTab === 'saved' ? savedRecipes : historyRecipes).map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={s.recipeItem}
                onPress={() => handleOpenRecipe(recipe.id)}
                activeOpacity={0.7}
              >
                <Text style={s.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                {recipe.createdAt ? (
                  <Text style={s.recipeDate}>
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))
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
        </View>
      </Animated.View>
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
    footer: {
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    },
    upgradeButton: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
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
  });
