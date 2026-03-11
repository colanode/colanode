import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Block,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { LocalMessageNode } from '@colanode/client/types/nodes';
import { ReplyTarget } from '@colanode/mobile/components/messages/message-item';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { getMessageText } from '@colanode/mobile/lib/message-utils';

export interface EditTarget {
  message: LocalMessageNode;
}

interface MessageInputProps {
  userId: string;
  parentId: string;
  replyTo?: ReplyTarget | null;
  onClearReply?: () => void;
  editTarget?: EditTarget | null;
  onClearEdit?: () => void;
}

const buildContentBlocks = (
  messageId: string,
  text: string
): Record<string, Block> => {
  const blockId = generateId(IdType.Block);
  return {
    [blockId]: {
      id: blockId,
      index: generateFractionalIndex(null, null),
      parentId: messageId,
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text,
        },
      ],
    },
  };
};

export const MessageInput = ({
  userId,
  parentId,
  replyTo,
  onClearReply,
  editTarget,
  onClearEdit,
}: MessageInputProps) => {
  const [text, setText] = useState('');
  const { mutate, isPending } = useMutation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // When editTarget changes, pre-fill input
  useEffect(() => {
    if (editTarget) {
      const existingText = getMessageText(editTarget.message);
      setText(existingText);
    }
  }, [editTarget]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    if (editTarget) {
      // Edit mode: update existing message via node.update
      const msg = editTarget.message;
      const newContent = buildContentBlocks(msg.id, trimmed);

      mutate({
        input: {
          type: 'node.update',
          userId,
          nodeId: msg.id,
          attributes: {
            type: 'message' as const,
            subtype: msg.subtype,
            parentId: msg.parentId!,
            content: newContent,
            referenceId: msg.referenceId,
            name: msg.name,
          },
        },
        onSuccess() {
          setText('');
          onClearEdit?.();
        },
        onError(error) {
          Alert.alert('Error', error.message);
        },
      });
      return;
    }

    // Normal send mode
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [
            {
              type: 'text' as const,
              text: trimmed,
            },
          ],
        },
      ],
    };

    mutate({
      input: {
        type: 'message.create',
        userId,
        parentId,
        content,
        referenceId: replyTo?.message.id,
      },
      onSuccess() {
        setText('');
        onClearReply?.();
      },
      onError(error) {
        Alert.alert('Error', error.message);
      },
    });
  };

  const handleCancelEdit = () => {
    setText('');
    onClearEdit?.();
  };

  const isEditing = !!editTarget;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {isEditing && (
        <View style={[styles.editBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.editBannerContent}>
            <Feather name="edit-2" size={14} color={colors.primaryLight} />
            <Text style={[styles.editBannerLabel, { color: colors.primaryLight }]}>Editing message</Text>
          </View>
          <Pressable onPress={handleCancelEdit} hitSlop={8}>
            <Feather name="x" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      )}
      {replyTo && !isEditing && (
        <View style={[styles.replyBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.replyBannerContent}>
            <Text style={[styles.replyBannerLabel, { color: colors.textMuted }]}>
              Replying to{' '}
              <Text style={[styles.replyBannerName, { color: colors.primaryLight }]}>{replyTo.authorName}</Text>
            </Text>
          </View>
          <Pressable onPress={onClearReply} hitSlop={8}>
            <Feather name="x" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textPlaceholder}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={10000}
          returnKeyType="default"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: colors.sendButton },
            (!text.trim() || isPending) && { backgroundColor: colors.sendButtonDisabled },
            pressed && styles.sendButtonPressed,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || isPending}
        >
          <Feather
            name={isEditing ? 'check' : 'arrow-up'}
            size={20}
            color={colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  editBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBannerLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  replyBannerContent: {
    flex: 1,
  },
  replyBannerLabel: {
    fontSize: 13,
  },
  replyBannerName: {
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
});
