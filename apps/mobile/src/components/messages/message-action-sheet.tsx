import Feather from '@expo/vector-icons/Feather';
import { useEffect } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { LocalMessageNode } from '@colanode/client/types/nodes';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { impactMedium } from '@colanode/mobile/lib/haptics';

interface MessageActionSheetProps {
  visible: boolean;
  message: LocalMessageNode | null;
  authorName: string;
  isOwnMessage: boolean;
  canDelete: boolean;
  userId: string;
  onClose: () => void;
  onReply: () => void;
  onReact: () => void;
  onCopy: () => void;
  onEdit: () => void;
}

export const MessageActionSheet = ({
  visible,
  message,
  isOwnMessage,
  canDelete,
  userId,
  onClose,
  onReply,
  onReact,
  onCopy,
  onEdit,
}: MessageActionSheetProps) => {
  const { mutate } = useMutation();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      impactMedium();
    }
  }, [visible]);

  const handleDelete = () => {
    if (!message) return;

    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          mutate({
            input: {
              type: 'node.delete',
              userId,
              nodeId: message.id,
            },
            onSuccess() {
              onClose();
            },
            onError(error) {
              Alert.alert('Error', error.message);
            },
          });
        },
      },
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Pressable
        style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
        onPress={() => { onReply(); onClose(); }}
        accessibilityRole="menuitem"
        accessibilityLabel="Reply"
      >
        <Feather name="corner-up-left" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Reply</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
        onPress={() => { onReact(); }}
        accessibilityRole="menuitem"
        accessibilityLabel="Add Reaction"
      >
        <Feather name="smile" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Add Reaction</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
        onPress={() => { onCopy(); onClose(); }}
        accessibilityRole="menuitem"
        accessibilityLabel="Copy Text"
      >
        <Feather name="copy" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Copy Text</Text>
      </Pressable>

      {isOwnMessage && (
        <Pressable
          style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
          onPress={() => { onEdit(); onClose(); }}
          accessibilityRole="menuitem"
          accessibilityLabel="Edit"
        >
          <Feather name="edit-2" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
        </Pressable>
      )}

      {canDelete && (
        <Pressable
          style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
          onPress={handleDelete}
          accessibilityRole="menuitem"
          accessibilityLabel="Delete message"
        >
          <Feather name="trash-2" size={20} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>
            Delete
          </Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [styles.cancelAction, { borderTopColor: colors.border }, pressed && { backgroundColor: colors.surfaceHover }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      >
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 16,
  },
  cancelAction: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
    borderTopWidth: 1,
  },
  cancelText: {
    fontSize: 16,
  },
});
