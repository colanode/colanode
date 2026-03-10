import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { LocalMessageNode } from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import {
  MessageActionTarget,
  MessageItem,
} from '@colanode/mobile/components/messages/message-item';
import { useTheme } from '@colanode/mobile/contexts/theme';

interface MessageListProps {
  messages: LocalMessageNode[];
  users: User[];
  currentUserId: string;
  onMessageAction?: (target: MessageActionTarget) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

interface MessageGroup {
  type: 'message' | 'date';
  message?: LocalMessageNode;
  date?: string;
  key: string;
}

const buildGroups = (messages: LocalMessageNode[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  let lastDate = '';

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const message of sorted) {
    const date = formatDate(message.createdAt);
    if (date !== lastDate) {
      groups.push({ type: 'date', date, key: `date-${date}-${message.id}` });
      lastDate = date;
    }
    groups.push({ type: 'message', message, key: message.id });
  }

  return groups.reverse();
};

export const MessageList = ({
  messages,
  users,
  currentUserId,
  onMessageAction,
}: MessageListProps) => {
  const { colors } = useTheme();
  const groups = useMemo(() => buildGroups(messages), [messages]);
  const messageMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item.key}
      inverted
      renderItem={({ item }) => {
        if (item.type === 'date') {
          return (
            <View style={styles.dateContainer}>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>{item.date}</Text>
            </View>
          );
        }

        if (item.message) {
          const refId = item.message.referenceId;
          const referencedMessage = refId ? messageMap.get(refId) : undefined;

          return (
            <MessageItem
              message={item.message}
              users={users}
              isOwnMessage={item.message.createdBy === currentUserId}
              onLongPress={onMessageAction}
              referencedMessage={referencedMessage}
              currentUserId={currentUserId}
            />
          );
        }

        return null;
      }}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  dateContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
