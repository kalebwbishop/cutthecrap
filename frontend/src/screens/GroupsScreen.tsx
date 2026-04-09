import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useSocialStore } from '@/store/socialStore';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

export default function GroupsScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const { groups, groupsLoading, loadGroups, createGroup, deleteGroup } = useSocialStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleCreate = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await createGroup(trimmed);
      setNewGroupName('');
      setShowCreate(false);
    } catch {
      showAlert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (groupId: string, groupName: string) => {
    const doDelete = async () => {
      try {
        await deleteGroup(groupId);
      } catch {
        showAlert('Failed to delete group');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${groupName}"? This cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Group', `Delete "${groupName}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleOpenGroup = (groupId: string) => {
    router.push(`/groups/${groupId}` as any);
  };

  function showAlert(message: string) {
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert('Error', message);
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backButton, { backgroundColor: colors.bgSubtle }]}
          onPress={handleBack}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeftIcon size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Groups</Text>
        <TouchableOpacity
          style={[s.createButton, { backgroundColor: colors.bgButton }]}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.7}
          accessibilityLabel="Create new group"
          accessibilityRole="button"
        >
          <Text style={s.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupsLoading ? (
          <ActivityIndicator style={s.loader} color={colors.textMuted} />
        ) : groups.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={[s.emptyEmoji]}>👥</Text>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No groups yet</Text>
            <Text style={[s.emptyBody, { color: colors.textMuted }]}>
              Create a group to start sharing recipes with friends.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[s.card, { borderColor: colors.border }]}
              onPress={() => handleOpenGroup(group.id)}
              activeOpacity={0.7}
              accessibilityLabel={`Open ${group.name}`}
              accessibilityRole="button"
            >
              <View style={s.cardInfo}>
                <Text style={[s.cardName, { color: colors.text }]}>{group.name}</Text>
                <Text style={[s.cardMeta, { color: colors.textMuted }]}>
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · {group.recipeCount} recipe{group.recipeCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={[s.roleBadge, { color: colors.textMuted }]}>
                {group.role === 'admin' ? 'Admin' : 'Member'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Create a Group</Text>
            <TextInput
              style={[s.input, { color: colors.text, backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              placeholder="Group name"
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
              editable={!creating}
              accessibilityLabel="Group name"
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => { setShowCreate(false); setNewGroupName(''); }}
                disabled={creating}
                activeOpacity={0.7}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={[s.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalCreateButton, { backgroundColor: colors.bgButton }, (!newGroupName.trim() || creating) && s.disabled]}
                onPress={handleCreate}
                disabled={!newGroupName.trim() || creating}
                activeOpacity={0.7}
                accessibilityLabel="Create group"
                accessibilityRole="button"
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.modalCreateText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
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
    createButton: {
      paddingHorizontal: spacing.md, paddingVertical: 8,
      borderRadius: radii.md,
    },
    createButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: fontSizes.sm },
    scrollContent: {
      paddingHorizontal: spacing.xxl, paddingBottom: 40,
      maxWidth: 768, width: '100%', alignSelf: 'center',
    },
    loader: { marginTop: spacing.xxl },
    emptyContainer: { alignItems: 'center', paddingTop: spacing.xxl },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
    emptyTitle: { fontSize: fontSizes['2xl'], fontWeight: '700', marginBottom: spacing.sm },
    emptyBody: { fontSize: fontSizes.base, lineHeight: 22, textAlign: 'center' },
    card: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.lg, borderBottomWidth: 1,
    },
    cardInfo: { flex: 1, marginRight: spacing.sm },
    cardName: { fontSize: fontSizes.lg, fontWeight: '600' },
    cardMeta: { fontSize: fontSizes.sm, marginTop: 4 },
    roleBadge: { fontSize: fontSizes.sm, fontStyle: 'italic' },
    disabled: { opacity: 0.5 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
    },
    modalContent: {
      borderRadius: radii.lg, padding: spacing.xl,
      width: '100%', maxWidth: 400,
    },
    modalTitle: { fontSize: fontSizes.xl, fontWeight: '700', marginBottom: spacing.lg },
    input: {
      borderWidth: 1, borderRadius: radii.md,
      paddingHorizontal: spacing.md, paddingVertical: 10,
      fontSize: fontSizes.base, marginBottom: spacing.lg,
    },
    modalActions: { flexDirection: 'row', gap: spacing.sm },
    modalCancelButton: {
      flex: 1, paddingVertical: 10, borderRadius: radii.md,
      borderWidth: 1, alignItems: 'center',
    },
    modalCancelText: { fontSize: fontSizes.base, fontWeight: '600' },
    modalCreateButton: {
      flex: 1, paddingVertical: 10, borderRadius: radii.md,
      alignItems: 'center', justifyContent: 'center', minHeight: 44,
    },
    modalCreateText: { fontSize: fontSizes.base, fontWeight: '600', color: '#FFFFFF' },
  });
