import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mapBlocksToContents } from '@colanode/client/lib';
import { LocalMessageNode } from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import { Block } from '@colanode/core';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { BlockRenderer } from '@colanode/mobile/components/messages/block-renderer';
import { MessageReactions } from '@colanode/mobile/components/messages/message-reactions';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { formatMessageTime } from '@colanode/mobile/lib/format-utils';
import { getMessagePreview } from '@colanode/mobile/lib/message-utils';

export interface MessageActionTarget {
  message: LocalMessageNode;
  authorName: string;
}

export interface ReplyTarget {
  message: LocalMessageNode;
  authorName: string;
}

interface MessageItemProps {
  message: LocalMessageNode;
  users: User[];
  isOwnMessage: boolean;
  onLongPress?: (target: MessageActionTarget) => void;
  referencedMessage?: LocalMessageNode;
  currentUserId: string;
}

export const MessageItem = memo(({
  message,
  users,
  isOwnMessage,
  onLongPress,
  referencedMessage,
  currentUserId,
}: MessageItemProps) => {
  const { appService } = useAppService();
  const { colors } = useTheme();
  const author = users.find((u) => u.id === message.createdBy);
  const authorName = author?.name ?? 'Unknown';

  const refAuthor = referencedMessage
    ? users.find((u) => u.id === referencedMessage.createdBy)
    : undefined;
  const refAuthorName = refAuthor?.name ?? 'Unknown';

  const { data: reactions } = useLiveQuery({
    type: 'node.reaction.list',
    nodeId: message.id,
    userId: currentUserId,
  });

  const handleToggleReaction = (reaction: string) => {
    const hasOwn = reactions?.some(
      (r) => r.reaction === reaction && r.collaboratorId === currentUserId
    );

    appService.mediator.executeMutation({
      type: hasOwn ? 'node.reaction.delete' : 'node.reaction.create',
      userId: currentUserId,
      nodeId: message.id,
      reaction,
    });
  };

  const content = message.content;
  let jsonContent = null;

  if (content && typeof content === 'object') {
    const blocks = Object.values(content) as Block[];
    const contents = mapBlocksToContents(message.id, blocks);
    if (contents.length > 0) {
      jsonContent = { type: 'doc' as const, content: contents };
    }
  }

  return (
    <Pressable
      onLongPress={() => onLongPress?.({ message, authorName })}
      delayLongPress={400}
    >
      <View style={styles.container}>
        {!isOwnMessage && (
          <UserAvatar
            name={authorName}
            avatar={author?.avatar ?? null}
            size={32}
          />
        )}
        <View
          style={[
            styles.bubble,
            { backgroundColor: isOwnMessage ? colors.ownBubble : colors.otherBubble },
            isOwnMessage && styles.ownBubble,
          ]}
        >
          {referencedMessage && (
            <View style={[styles.replyPreview, { borderLeftColor: colors.replyAccent }]}>
              <Text style={[styles.replyAuthor, { color: colors.replyAccent }]}>{refAuthorName}</Text>
              <Text style={[styles.replyText, { color: colors.textMuted }]} numberOfLines={1}>
                {getMessagePreview(referencedMessage)}
              </Text>
            </View>
          )}
          {!isOwnMessage && (
            <Text style={[styles.authorName, { color: colors.primaryLight }]}>{authorName}</Text>
          )}
          {jsonContent ? (
            <BlockRenderer content={jsonContent} />
          ) : (
            <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>(empty message)</Text>
          )}
          <Text style={[styles.time, { color: colors.textMuted }]}>{formatMessageTime(message.createdAt)}</Text>
        </View>
        {isOwnMessage && <View style={styles.ownSpacer} />}
      </View>
      {reactions && reactions.length > 0 && (
        <View
          style={[
            styles.reactionsRow,
            isOwnMessage ? styles.reactionsOwn : styles.reactionsOther,
          ]}
        >
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            onToggleReaction={handleToggleReaction}
          />
        </View>
      )}
    </Pressable>
  );
});
MessageItem.displayName = 'MessageItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownBubble: {
    marginLeft: 'auto',
  },
  ownSpacer: {
    width: 0,
  },
  replyPreview: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginBottom: 6,
    gap: 1,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 12,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  emptyMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  reactionsRow: {
    paddingHorizontal: 52,
    paddingBottom: 2,
  },
  reactionsOwn: {
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  reactionsOther: {
    alignItems: 'flex-start',
  },
});
