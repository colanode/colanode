import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

interface WorkspaceDeleteSheetProps {
  visible: boolean;
  userId: string;
  workspaceName: string;
  onClose: () => void;
  onDeleted: () => void;
  onError: (message: string) => void;
}

export const WorkspaceDeleteSheet = ({
  visible,
  userId,
  workspaceName,
  onClose,
  onDeleted,
  onError,
}: WorkspaceDeleteSheetProps) => {
  const { colors } = useTheme();
  const { mutate, isPending } = useMutation();

  const handleDelete = () => {
    mutate({
      input: {
        type: 'workspace.delete',
        userId,
      },
      onSuccess() {
        onClose();
        onDeleted();
      },
      onError(error) {
        onClose();
        onError(error.message);
      },
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Feather name="alert-triangle" size={32} color={colors.error} />
        <Text style={[styles.title, { color: colors.text }]}>
          Delete workspace
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Are you sure you want to delete "{workspaceName}"? This action cannot
          be undone. This workspace will no longer be accessible by you or other
          users that are part of it.
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onClose}
          disabled={isPending}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: colors.error },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleDelete}
          disabled={isPending}
        >
          <Text style={styles.deleteText}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
