import { setStringAsync } from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LocalChannelNode, LocalMessageNode } from '@colanode/client/types/nodes';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { EmojiPicker } from '@colanode/mobile/components/emojis/emoji-picker';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { MessageActionSheet } from '@colanode/mobile/components/messages/message-action-sheet';
import { EditTarget, MessageInput } from '@colanode/mobile/components/messages/message-input';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import {
  MessageActionTarget,
  ReplyTarget,
} from '@colanode/mobile/components/messages/message-item';
import { getMessageText } from '@colanode/mobile/lib/message-utils';
import { MessageList } from '@colanode/mobile/components/messages/message-list';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';

export default function ChannelScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { userId } = useWorkspace();
  const { appService } = useAppService();
  const { colors } = useTheme();
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const { mutate } = useMutation();
  const lastMarkedId = useRef<string | null>(null);

  // Mark channel as seen/opened on mount and when channelId changes
  useEffect(() => {
    if (!channelId || lastMarkedId.current === channelId) return;
    lastMarkedId.current = channelId;

    appService.mediator.executeMutation({
      type: 'node.interaction.seen',
      userId,
      nodeId: channelId,
    });
    appService.mediator.executeMutation({
      type: 'node.interaction.opened',
      userId,
      nodeId: channelId,
    });
  }, [channelId, userId, appService]);

  const { data: channel } = useNodeQuery<LocalChannelNode>(userId, channelId, 'channel');

  const { data: messages, isLoading } = useNodeListQuery<LocalMessageNode>(
    userId,
    [
      { field: ['parentId'], operator: 'eq', value: channelId },
      { field: ['type'], operator: 'eq', value: 'message' },
    ],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    100
  );

  const { data: users } = useLiveQuery({
    type: 'user.list',
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
        Alert.alert('Error', error.message);
      },
    });
    setActionTarget(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton onPress={() => router.back()} />
        <Pressable
          onPress={() => channel && setShowRename(true)}
          style={styles.headerTitleContainer}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            # {channel?.name ?? 'Channel'}
          </Text>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>
      <MessageList
        messages={messages ?? []}
        users={users ?? []}
        currentUserId={userId}
        onMessageAction={handleMessageAction}
      />
      <MessageInput
        userId={userId}
        parentId={channelId!}
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
      <RenameNodeSheet
        visible={showRename}
        node={channel ?? null}
        userId={userId}
        onClose={() => setShowRename(false)}
      />
    </KeyboardAvoidingView>
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
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
});
