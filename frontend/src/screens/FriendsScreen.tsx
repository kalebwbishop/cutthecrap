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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from '@/components/Icons';
import { useSocialStore } from '@/store/socialStore';
import { useThemeColors, fontSizes, spacing, radii } from '@/theme';
import type { ThemeColors } from '@/theme';

export default function FriendsScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const {
    friends,
    friendRequests,
    sentRequests,
    friendsLoading,
    loadFriends,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useSocialStore();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadFriends();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleSendRequest = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      await sendFriendRequest(trimmed);
      setSendSuccess(`Friend request sent to ${trimmed}!`);
      setEmail('');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to send request';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptRequest(id);
    } catch {
      showAlert('Failed to accept request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id);
    } catch {
      showAlert('Failed to reject request');
    }
  };

  const handleRemove = async (friendshipId: string, name: string) => {
    const doRemove = async () => {
      try {
        await removeFriend(friendshipId);
      } catch {
        showAlert('Failed to remove friend');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${name} as a friend?`)) {
        await doRemove();
      }
    } else {
      Alert.alert('Remove Friend', `Remove ${name} as a friend?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  function showAlert(message: string) {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Error', message);
    }
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
        <Text style={[s.headerTitle, { color: colors.text }]}>Friends</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Add Friend */}
        <Text style={[s.sectionTitle, { color: colors.text }]}>Add a Friend</Text>
        <Text style={[s.sectionDescription, { color: colors.textMuted }]}>
          Enter your friend's email address to send them a request.
        </Text>
        <View style={s.addRow}>
          <TextInput
            style={[s.input, { color: colors.text, backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            placeholder="friend@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(t) => { setEmail(t); setSendError(null); setSendSuccess(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!sending}
          />
          <TouchableOpacity
            style={[s.sendButton, { backgroundColor: colors.bgButton }, (!email.trim() || sending) && s.disabled]}
            onPress={handleSendRequest}
            activeOpacity={0.7}
            disabled={!email.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
        {sendError ? <Text style={[s.errorText, { color: colors.error }]}>{sendError}</Text> : null}
        {sendSuccess ? <Text style={[s.successText, { color: colors.success ?? '#22c55e' }]}>{sendSuccess}</Text> : null}

        {/* Tabs */}
        <View style={[s.toggleRow, { backgroundColor: colors.bgSubtle }]}>
          <TouchableOpacity
            style={[s.toggleButton, activeTab === 'friends' && [s.toggleButtonActive, { backgroundColor: colors.background }]]}
            onPress={() => setActiveTab('friends')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleText, { color: colors.textMuted }, activeTab === 'friends' && { color: colors.text }]}>
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleButton, activeTab === 'requests' && [s.toggleButtonActive, { backgroundColor: colors.background }]]}
            onPress={() => setActiveTab('requests')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleText, { color: colors.textMuted }, activeTab === 'requests' && { color: colors.text }]}>
              Requests ({friendRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {friendsLoading ? (
          <ActivityIndicator style={s.loader} color={colors.textMuted} />
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.textMuted }]}>No friends yet. Send a request above!</Text>
          ) : (
            friends.map((f) => (
              <View key={f.friendshipId} style={[s.card, { borderColor: colors.border }]}>
                <View style={s.cardInfo}>
                  <Text style={[s.cardName, { color: colors.text }]}>{f.user.name}</Text>
                  <Text style={[s.cardEmail, { color: colors.textMuted }]}>{f.user.email}</Text>
                </View>
                <TouchableOpacity
                  style={[s.removeButton, { borderColor: colors.error }]}
                  onPress={() => handleRemove(f.friendshipId, f.user.name)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.removeText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          <>
            {friendRequests.length === 0 && sentRequests.length === 0 ? (
              <Text style={[s.emptyText, { color: colors.textMuted }]}>No pending requests.</Text>
            ) : null}

            {friendRequests.length > 0 ? (
              <>
                <Text style={[s.subheading, { color: colors.text }]}>Incoming</Text>
                {friendRequests.map((r) => (
                  <View key={r.id} style={[s.card, { borderColor: colors.border }]}>
                    <View style={s.cardInfo}>
                      <Text style={[s.cardName, { color: colors.text }]}>{r.user.name}</Text>
                      <Text style={[s.cardEmail, { color: colors.textMuted }]}>{r.user.email}</Text>
                    </View>
                    <View style={s.requestActions}>
                      <TouchableOpacity
                        style={[s.acceptButton, { backgroundColor: colors.bgButton }]}
                        onPress={() => handleAccept(r.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.acceptText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.rejectButton, { borderColor: colors.border }]}
                        onPress={() => handleReject(r.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.rejectText, { color: colors.textMuted }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {sentRequests.length > 0 ? (
              <>
                <Text style={[s.subheading, { color: colors.text }]}>Sent</Text>
                {sentRequests.map((r) => (
                  <View key={r.id} style={[s.card, { borderColor: colors.border }]}>
                    <View style={s.cardInfo}>
                      <Text style={[s.cardName, { color: colors.text }]}>{r.user.name}</Text>
                      <Text style={[s.cardEmail, { color: colors.textMuted }]}>{r.user.email}</Text>
                    </View>
                    <Text style={[s.pendingBadge, { color: colors.textMuted }]}>Pending</Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    backButton: {
      width: 32, height: 32, borderRadius: radii.full,
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: fontSizes.xl, fontWeight: '600', flex: 1 },
    headerSpacer: { width: 32 },
    scrollContent: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: 40,
      maxWidth: 768,
      width: '100%',
      alignSelf: 'center',
    },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: '700', marginTop: spacing.md },
    sectionDescription: { fontSize: fontSizes.sm, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },
    addRow: { flexDirection: 'row', gap: spacing.sm },
    input: {
      flex: 1, borderWidth: 1, borderRadius: radii.md,
      paddingHorizontal: spacing.md, paddingVertical: 10,
      fontSize: fontSizes.base,
    },
    sendButton: {
      paddingHorizontal: spacing.lg, borderRadius: radii.md,
      justifyContent: 'center', alignItems: 'center', minHeight: 44,
    },
    sendButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: fontSizes.base },
    disabled: { opacity: 0.5 },
    errorText: { fontSize: fontSizes.sm, marginTop: spacing.xs },
    successText: { fontSize: fontSizes.sm, marginTop: spacing.xs },
    toggleRow: {
      flexDirection: 'row', marginTop: spacing.xl, marginBottom: spacing.md,
      borderRadius: radii.md, padding: 3,
    },
    toggleButton: { flex: 1, paddingVertical: 8, borderRadius: radii.md - 2, alignItems: 'center' },
    toggleButtonActive: {},
    toggleText: { fontSize: fontSizes.sm, fontWeight: '600' },
    loader: { marginTop: spacing.xl },
    emptyText: { fontSize: fontSizes.base, marginTop: spacing.lg, textAlign: 'center' },
    subheading: { fontSize: fontSizes.base, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs },
    card: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.md, borderBottomWidth: 1,
    },
    cardInfo: { flex: 1, marginRight: spacing.sm },
    cardName: { fontSize: fontSizes.base, fontWeight: '500' },
    cardEmail: { fontSize: fontSizes.sm, marginTop: 2 },
    removeButton: {
      paddingHorizontal: spacing.md, paddingVertical: 6,
      borderRadius: radii.md, borderWidth: 1,
    },
    removeText: { fontSize: fontSizes.sm, fontWeight: '600' },
    requestActions: { flexDirection: 'row', gap: spacing.xs },
    acceptButton: {
      paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.md,
    },
    acceptText: { color: '#FFFFFF', fontSize: fontSizes.sm, fontWeight: '600' },
    rejectButton: {
      paddingHorizontal: spacing.md, paddingVertical: 6,
      borderRadius: radii.md, borderWidth: 1,
    },
    rejectText: { fontSize: fontSizes.sm, fontWeight: '600' },
    pendingBadge: { fontSize: fontSizes.sm, fontStyle: 'italic' },
  });
