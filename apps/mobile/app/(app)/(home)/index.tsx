import Feather from '@expo/vector-icons/Feather';
import { Link, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LocalChatNode, LocalSpaceNode } from '@colanode/client/types/nodes';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { ChatListItem } from '@colanode/mobile/components/chats/chat-list-item';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useWorkspaceSwitcher } from '@colanode/mobile/contexts/workspace-switcher';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { getNodeUnreadCount, getUnreadSummary } from '@colanode/mobile/lib/radar-utils';

export default function HomeScreen() {
  const router = useRouter();
  const { accountId, userId, workspace } = useWorkspace();
  const { openSwitcher } = useWorkspaceSwitcher();
  const { colors } = useTheme();

  const { data: accounts } = useLiveQuery({ type: 'account.list' });
  const account = accounts?.find((a) => a.id === accountId);
  const greeting = account?.name ? `Hello, ${account.name}` : 'Welcome';

  const { data: users } = useLiveQuery({ type: 'user.list', userId });

  const { data: radarData } = useLiveQuery({ type: 'radar.data.get' });
  const { totalUnread, unreadChats } = getUnreadSummary(radarData, userId);

  // Recent chats (limit 3)
  const { data: recentChats, refetch: refetchChats, isRefetching: isRefetchingChats } = useNodeListQuery<LocalChatNode>(
    userId,
    [{ field: ['type'], operator: 'eq', value: 'chat' }],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    3
  );

  // Recent spaces
  const { data: recentSpaces, refetch: refetchSpaces, isRefetching: isRefetchingSpaces } = useNodeListQuery<LocalSpaceNode>(
    userId,
    [{ field: ['type'], operator: 'eq', value: 'space' }],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    3
  );

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingChats || isRefetchingSpaces}
          onRefresh={() => {
            refetchChats();
            refetchSpaces();
          }}
          tintColor={colors.textMuted}
        />
      }
    >
      <Pressable style={styles.header} onPress={openSwitcher}>
        <UserAvatar
          name={workspace.name}
          avatar={workspace.avatar ?? null}
          size={56}
        />
        <View style={styles.headerText}>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
          <View style={styles.workspaceRow}>
            <Text style={[styles.workspace, { color: colors.textSecondary }]}>{workspace.name}</Text>
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          </View>
        </View>
      </Pressable>

      {totalUnread > 0 && (
        <View style={[styles.unreadCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
          <Text style={[styles.unreadText, { color: colors.textSecondary }]}>
            {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
            {unreadChats > 0
              ? ` in ${unreadChats} conversation${unreadChats !== 1 ? 's' : ''}`
              : ''}
          </Text>
        </View>
      )}

      <View style={styles.quickActions}>
        <Pressable
          style={({ pressed }) => [
            styles.quickAction,
            { backgroundColor: colors.surfaceAccent },
            pressed && { backgroundColor: colors.surfaceAccentDeep },
          ]}
          onPress={() => router.push('/(app)/(chats)/new-chat')}
        >
          <Feather name="message-circle" size={20} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>New Chat</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.quickAction,
            { backgroundColor: colors.surfaceAccent },
            pressed && { backgroundColor: colors.surfaceAccentDeep },
          ]}
          onPress={() => router.push('/(app)/(spaces)/create-space')}
        >
          <Feather name="plus-circle" size={20} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>New Space</Text>
        </Pressable>
      </View>

      {recentChats && recentChats.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent conversations</Text>
          {recentChats.map((chat) => (
            <Link
              key={chat.id}
              href={{ pathname: '/(app)/(chats)/[chatId]', params: { chatId: chat.id } }}
              withAnchor
              asChild
            >
              <ChatListItem
                chat={chat}
                currentUserId={userId}
                users={users ?? []}
                onPress={() => {}}
                unreadCount={getNodeUnreadCount(radarData, userId, chat.id)}
              />
            </Link>
          ))}
        </View>
      )}

      {recentSpaces && recentSpaces.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent spaces</Text>
          {recentSpaces.map((space) => (
            <Pressable
              key={space.id}
              style={({ pressed }) => [
                styles.spaceRow,
                pressed && { backgroundColor: colors.surface },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(spaces)/space/[spaceId]',
                  params: { spaceId: space.id },
                })
              }
            >
              <UserAvatar
                name={space.name ?? 'Space'}
                avatar={null}
                size={40}
              />
              <View style={styles.spaceInfo}>
                <Text style={[styles.spaceName, { color: colors.text }]} numberOfLines={1}>
                  {space.name ?? 'Untitled Space'}
                </Text>
                {space.description ? (
                  <Text style={[styles.spaceDesc, { color: colors.textMuted }]} numberOfLines={1}>
                    {space.description}
                  </Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workspace: {
    fontSize: 14,
  },
  unreadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
  },
  unreadText: {
    fontSize: 13,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  spaceInfo: {
    flex: 1,
    gap: 2,
  },
  spaceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  spaceDesc: {
    fontSize: 13,
  },
});
