import { setStringAsync } from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalMessageNode, LocalNode, NodeReaction } from '@colanode/client/types/nodes';
import { EmojiPicker } from '@colanode/mobile/components/emojis/emoji-picker';
import { SkeletonMessageList } from '@colanode/mobile/components/ui/skeleton';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { MessageActionSheet } from '@colanode/mobile/components/messages/message-action-sheet';
import { EditTarget, MessageInput } from '@colanode/mobile/components/messages/message-input';
import {
  MessageActionTarget,
  ReplyTarget,
} from '@colanode/mobile/components/messages/message-item';
import { MessageList } from '@colanode/mobile/components/messages/message-list';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { getMessageText } from '@colanode/mobile/lib/message-utils';

const PAGE_SIZE = 50;

interface ConversationScreenProps {
  nodeId: string;
  isAdmin?: boolean;
  title: string;
  onGoBack: () => void;
  renamableNode?: LocalNode | null;
}

export const ConversationScreen = ({
  nodeId,
  isAdmin = false,
  title,
  onGoBack,
  renamableNode,
}: ConversationScreenProps) => {
  const { userId } = useWorkspace();
  const { appService } = useAppService();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const { mutate } = useMutation();
  const toast = useToast();
  const lastMarkedId = useRef<string | null>(null);
  const [olderMessages, setOlderMessages] = useState<LocalMessageNode[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Reset pagination when conversation changes
  useEffect(() => {
    setOlderMessages([]);
    setHasMore(true);
  }, [nodeId]);

  useEffect(() => {
    if (!nodeId || lastMarkedId.current === nodeId) return;
    lastMarkedId.current = nodeId;

    const markInteractions = async () => {
      try {
        await appService.mediator.executeMutation({
          type: 'node.interaction.seen',
          userId,
          nodeId,
        });
        await appService.mediator.executeMutation({
          type: 'node.interaction.opened',
          userId,
          nodeId,
        });
      } catch {
        // Silently ignore — interaction tracking is best-effort
      }
    };

    markInteractions();
  }, [nodeId, userId, appService]);

  const { data: recentMessages, isLoading } = useNodeListQuery(
    userId,
    [
      { field: ['parentId'], operator: 'eq', value: nodeId },
      { field: ['type'], operator: 'eq', value: 'message' },
    ],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    PAGE_SIZE
  );

  // Merge recent (reactive) messages with older (paginated) messages
  const allMessages = useMemo(() => {
    const recent = (recentMessages as LocalMessageNode[] | undefined) ?? [];
    if (olderMessages.length === 0) return recent;

    // Deduplicate by id — recent messages take priority
    const recentIds = new Set(recent.map((m) => m.id));
    const uniqueOlder = olderMessages.filter((m) => !recentIds.has(m.id));
    return [...recent, ...uniqueOlder];
  }, [recentMessages, olderMessages]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const offset = allMessages.length;
      const older = await appService.mediator.executeQuery({
        type: 'node.list',
        userId,
        filters: [
          { field: ['parentId'], operator: 'eq', value: nodeId },
          { field: ['type'], operator: 'eq', value: 'message' },
        ],
        sorts: [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
        limit: PAGE_SIZE,
        offset,
      });

      if (older.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (older.length > 0) {
        setOlderMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = (older as LocalMessageNode[]).filter(
            (m) => !existingIds.has(m.id)
          );
          return [...prev, ...newMessages];
        });
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, allMessages.length, appService, userId, nodeId]);

  const { data: users } = useLiveQuery({
    type: 'user.list',
    userId,
  });

  // Batch reaction query for all visible messages
  const messageIds = useMemo(
    () => allMessages.map((m) => m.id),
    [allMessages]
  );

  const { data: reactionsMap } = useLiveQuery({
    type: 'node.reaction.batch-list',
    nodeIds: messageIds,
    userId,
  });

  const handleMessageAction = (target: MessageActionTarget) => {
    setActionTarget(target);
  };

  const handleReply = () => {
    if (!actionTarget) return;
    setEditTarget(null);
    setReplyTo({
      message: actionTarget.message,
      authorName: actionTarget.authorName,
    });
  };

  const handleEdit = () => {
    if (!actionTarget) return;
    setReplyTo(null);
    setEditTarget({ message: actionTarget.message });
  };

  const handleCopy = () => {
    if (!actionTarget) return;
    const text = getMessageText(actionTarget.message);
    setStringAsync(text);
  };

  const handleReact = () => {
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!actionTarget) return;
    mutate({
      input: {
        type: 'node.reaction.create',
        userId,
        nodeId: actionTarget.message.id,
        reaction: emoji,
      },
      onError(error) {
        toast.show(error.message);
      },
    });
    setActionTarget(null);
  };

  if (isLoading) {
    return <SkeletonMessageList />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <BackButton onPress={onGoBack} />
        {renamableNode ? (
          <Pressable
            onPress={() => setShowRename(true)}
            style={styles.headerTitleContainer}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={styles.headerSpacer} />
      </View>
      <MessageList
        messages={allMessages}
        users={users ?? []}
        currentUserId={userId}
        onMessageAction={handleMessageAction}
        reactionsMap={reactionsMap ?? undefined}
        onLoadMore={hasMore ? handleLoadMore : undefined}
        loadingMore={loadingMore}
      />
      <MessageInput
        userId={userId}
        parentId={nodeId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        editTarget={editTarget}
        onClearEdit={() => setEditTarget(null)}
      />
      <MessageActionSheet
        visible={actionTarget !== null && !showEmojiPicker}
        message={actionTarget?.message ?? null}
        authorName={actionTarget?.authorName ?? ''}
        isOwnMessage={actionTarget?.message.createdBy === userId}
        canDelete={actionTarget?.message.createdBy === userId || isAdmin}
        userId={userId}
        onClose={() => setActionTarget(null)}
        onReply={handleReply}
        onReact={handleReact}
        onCopy={handleCopy}
        onEdit={handleEdit}
      />
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => {
          setShowEmojiPicker(false);
          setActionTarget(null);
        }}
        onSelect={handleEmojiSelect}
      />
      {renamableNode && (
        <RenameNodeSheet
          visible={showRename}
          node={renamableNode}
          userId={userId}
          onClose={() => setShowRename(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
});
