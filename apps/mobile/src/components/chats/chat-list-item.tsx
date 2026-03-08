import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Block } from '@colanode/core';
import { LocalChatNode, LocalMessageNode } from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useQuery } from '@colanode/mobile/hooks/use-query';

interface ChatListItemProps {
  chat: LocalChatNode;
  currentUserId: string;
  users: User[];
  onPress: () => void;
  unreadCount?: number;
}

const getMessageText = (message: LocalMessageNode): string => {
  const content = message.content;
  if (content && typeof content === 'object') {
    const blocks = Object.values(content) as Block[];
    for (const block of blocks) {
      if (block.content) {
        const texts: string[] = [];
        for (const child of block.content) {
          if (child.type === 'text' && child.text) {
            texts.push(child.text);
          }
        }
        if (texts.length > 0) {
          const preview = texts.join(' ');
          return preview.length > 60 ? preview.slice(0, 60) + '...' : preview;
        }
      }
    }
  }
  return '';
};

export const ChatListItem = ({
  chat,
  currentUserId,
  users,
  onPress,
  unreadCount,
}: ChatListItemProps) => {
  const { colors } = useTheme();
  const { data: messages } = useQuery({
    type: 'node.list',
    userId: currentUserId,
    filters: [
      { field: ['parentId'], operator: 'eq', value: chat.id },
      { field: ['type'], operator: 'eq', value: 'message' },
    ],
    sorts: [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    limit: 1,
  });

  const lastMessage = (messages as LocalMessageNode[] | undefined)?.[0];
  const messagePreview = lastMessage ? getMessageText(lastMessage) : '';

  const otherUserId = Object.keys(chat.collaborators).find(
    (id) => id !== currentUserId
  );
  const otherUser = users.find((u) => u.id === otherUserId);
  const displayName = otherUser?.name ?? 'Unknown';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <UserAvatar name={displayName} avatar={otherUser?.avatar ?? null} size={44} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        {messagePreview ? (
          <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
            {messagePreview}
          </Text>
        ) : null}
      </View>
      {!!unreadCount && unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.badgeBackground }]}>
          <Text style={[styles.badgeText, { color: colors.badgeText }]}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  preview: {
    fontSize: 13,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
