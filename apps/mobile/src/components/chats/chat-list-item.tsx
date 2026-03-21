import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LocalChatNode, LocalMessageNode } from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { getMessagePreview } from '@colanode/mobile/lib/message-utils';

interface ChatListItemProps {
  chat: LocalChatNode;
  currentUserId: string;
  users: User[];
  onPress: () => void;
  unreadCount?: number;
}

export const ChatListItem = memo(({
  chat,
  currentUserId,
  users,
  onPress,
  unreadCount,
}: ChatListItemProps) => {
  const { colors } = useTheme();
  const { data: messages } = useNodeListQuery<LocalMessageNode>(
    currentUserId,
    [
      { field: ['parentId'], operator: 'eq', value: chat.id },
      { field: ['type'], operator: 'eq', value: 'message' },
    ],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    1
  );

  const lastMessage = messages?.[0];
  const messagePreview = lastMessage ? getMessagePreview(lastMessage) : '';

  const otherUserId = Object.keys(chat.collaborators).find(
    (id) => id !== currentUserId
  );
  const otherUser = users.find((u) => u.id === otherUserId);
  const displayName = otherUser?.name ?? 'Unknown';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { backgroundColor: colors.surface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${displayName}`}
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
});
ChatListItem.displayName = 'ChatListItem';

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
