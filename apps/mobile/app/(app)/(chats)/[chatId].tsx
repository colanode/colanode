import { setStringAsync } from 'expo-clipboard';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LocalChatNode, LocalMessageNode } from '@colanode/client/types/nodes';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { EmojiPicker } from '@colanode/mobile/components/emojis/emoji-picker';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { MessageActionSheet } from '@colanode/mobile/components/messages/message-action-sheet';
import { EditTarget, MessageInput } from '@colanode/mobile/components/messages/message-input';
import {
  MessageActionTarget,
  ReplyTarget,
  getMessageText,
} from '@colanode/mobile/components/messages/message-item';
import { MessageList } from '@colanode/mobile/components/messages/message-list';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { userId } = useWorkspace();
  const { appService } = useAppService();
  const { colors } = useTheme();
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { mutate } = useMutation();
  const navigation = useNavigation();
  const lastMarkedId = useRef<string | null>(null);

  const handleGoBack = useCallback(() => {
    // Check if the Stack has a screen below us (e.g. the chat list).
    // When deep-linked from another tab the index may be missing.
    const state = navigation.getState();
    if (state && state.index > 0) {
      router.back();
    } else {
      router.replace('/(app)/(chats)/');
    }
  }, [navigation, router]);

  // Mark chat as seen/opened on mount and when chatId changes
  useEffect(() => {
    if (!chatId || lastMarkedId.current === chatId) return;
    lastMarkedId.current = chatId;

    appService.mediator.executeMutation({
      type: 'node.interaction.seen',
      userId,
      nodeId: chatId,
    });
    appService.mediator.executeMutation({
      type: 'node.interaction.opened',
      userId,
      nodeId: chatId,
    });
  }, [chatId, userId, appService]);

  const { data: messages, isLoading } = useNodeListQuery(
    userId,
    [
      { field: ['parentId'], operator: 'eq', value: chatId },
      { field: ['type'], operator: 'eq', value: 'message' },
    ],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }],
    100
  );

  const { data: users } = useLiveQuery({
    type: 'user.list',
    userId,
  });

  const { data: chatNodes } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: chatId },
      { field: ['type'], operator: 'eq', value: 'chat' },
    ],
    [],
    1
  );

  const chat = chatNodes?.[0] as LocalChatNode | undefined;
  const otherUserId = chat
    ? Object.keys(chat.collaborators).find((id) => id !== userId)
    : undefined;
  const otherUser = users?.find((u) => u.id === otherUserId);
  const chatName = otherUser?.name ?? 'Chat';

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
        <BackButton onPress={handleGoBack} />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {chatName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <MessageList
        messages={(messages as LocalMessageNode[] | undefined) ?? []}
        users={users ?? []}
        currentUserId={userId}
        onMessageAction={handleMessageAction}
      />
      <MessageInput
        userId={userId}
        parentId={chatId!}
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
