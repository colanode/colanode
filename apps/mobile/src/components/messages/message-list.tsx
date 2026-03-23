import Feather from '@expo/vector-icons/Feather';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LocalMessageNode, NodeReaction } from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import {
  MessageActionTarget,
  MessageItem,
} from '@colanode/mobile/components/messages/message-item';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { formatRelativeDate } from '@colanode/mobile/lib/format-utils';

interface MessageListProps {
  messages: LocalMessageNode[];
  users: User[];
  currentUserId: string;
  onMessageAction?: (target: MessageActionTarget) => void;
  reactionsMap?: Record<string, NodeReaction[]>;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

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
    const date = formatRelativeDate(message.createdAt);
    if (date !== lastDate) {
      groups.push({ type: 'date', date, key: `date-${date}-${message.id}` });
      lastDate = date;
    }
    groups.push({ type: 'message', message, key: message.id });
  }

  return groups.reverse();
};

const SCROLL_THRESHOLD = 300;

export const MessageList = ({
  messages,
  users,
  currentUserId,
  onMessageAction,
  reactionsMap,
  onLoadMore,
  loadingMore,
}: MessageListProps) => {
  const { colors } = useTheme();
  const groups = useMemo(() => buildGroups(messages), [messages]);
  const messageMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      const shouldShow = offset > SCROLL_THRESHOLD;

      if (shouldShow !== showScrollButton) {
        setShowScrollButton(shouldShow);
        Animated.timing(scrollButtonOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [showScrollButton, scrollButtonOpacity]
  );

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={groups}
        keyExtractor={(item) => item.key}
        inverted
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
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
                reactions={reactionsMap?.[item.message.id]}
              />
            );
          }

          return null;
        }}
        contentContainerStyle={[
          styles.list,
          groups.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
              No messages yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Start the conversation
            </Text>
          </View>
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.textMuted} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
      {showScrollButton && (
        <Animated.View style={[styles.scrollButton, { opacity: scrollButtonOpacity }]}>
          <Pressable
            style={[styles.scrollButtonInner, { backgroundColor: colors.surface }]}
            onPress={scrollToBottom}
            accessibilityRole="button"
            accessibilityLabel="Scroll to bottom"
          >
            <Feather name="chevron-down" size={20} color={colors.text} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
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
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
  },
  scrollButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  scrollButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
});
