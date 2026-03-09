import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LocalChatNode } from '@colanode/client/types/nodes';
import { ChatListItem } from '@colanode/mobile/components/chats/chat-list-item';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export default function ChatsScreen() {
  const router = useRouter();
  const { userId } = useWorkspace();
  const { colors } = useTheme();

  const { data: chats, isLoading, refetch, isRefetching } = useNodeListQuery(
    userId,
    [{ field: ['type'], operator: 'eq', value: 'chat' }],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }]
  );

  const { data: users } = useLiveQuery({
    type: 'user.list',
    userId,
  });

  const { data: radarData } = useLiveQuery({
    type: 'radar.data.get',
  });

  const workspaceRadar = radarData?.[userId];

  const getUnreadCount = (chatId: string): number => {
    return workspaceRadar?.nodeStates[chatId]?.unreadCount ?? 0;
  };

  const handleOpenChat = (chat: LocalChatNode) => {
    router.push({
      pathname: '/(app)/(chats)/[chatId]',
      params: { chatId: chat.id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
      </View>
      <FlatList
        data={(chats as LocalChatNode[] | undefined) ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            currentUserId={userId}
            users={users ?? []}
            onPress={() => handleOpenChat(item)}
            unreadCount={getUnreadCount(item.id)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.listSeparator }]} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No chats yet"
              subtitle="Start a new conversation"
            />
          ) : null
        }
        ListFooterComponent={
          chats && chats.length > 0 && chats.length <= 3 ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Start conversations with your workspace members
            </Text>
          ) : null
        }
      />
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.surface },
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push('/(app)/(chats)/new-chat')}
      >
        <Feather name="plus" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  list: {
    flexGrow: 1,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
