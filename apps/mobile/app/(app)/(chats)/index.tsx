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
        <Pressable
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: colors.border },
            pressed && styles.newButtonPressed,
          ]}
          onPress={() => router.push('/(app)/(chats)/new-chat')}
        >
          <Text style={[styles.newButtonText, { color: colors.text }]}>New</Text>
        </Pressable>
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
      />
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
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonPressed: {
    opacity: 0.7,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    flexGrow: 1,
  },
});
