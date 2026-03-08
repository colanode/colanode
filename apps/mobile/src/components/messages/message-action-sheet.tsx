import Feather from '@expo/vector-icons/Feather';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LocalMessageNode } from '@colanode/client/types/nodes';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

interface MessageActionSheetProps {
  visible: boolean;
  message: LocalMessageNode | null;
  authorName: string;
  isOwnMessage: boolean;
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
  userId,
  onClose,
  onReply,
  onReact,
  onCopy,
  onEdit,
}: MessageActionSheetProps) => {
  const { mutate } = useMutation();
  const { colors } = useTheme();

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />

          <Pressable
            style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
            onPress={() => { onReply(); onClose(); }}
          >
            <Feather name="corner-up-left" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Reply</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
            onPress={() => { onReact(); }}
          >
            <Feather name="smile" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Add Reaction</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
            onPress={() => { onCopy(); onClose(); }}
          >
            <Feather name="copy" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Copy Text</Text>
          </Pressable>

          {isOwnMessage && (
            <Pressable
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
              onPress={() => { onEdit(); onClose(); }}
            >
              <Feather name="edit-2" size={20} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
            </Pressable>
          )}

          {isOwnMessage && (
            <Pressable
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
              onPress={handleDelete}
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
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
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
