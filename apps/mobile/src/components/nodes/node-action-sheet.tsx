import Feather from '@expo/vector-icons/Feather';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

interface NodeActionSheetProps {
  visible: boolean;
  nodeId: string | null;
  nodeName: string;
  userId: string;
  onClose: () => void;
}

export const NodeActionSheet = ({
  visible,
  nodeId,
  nodeName,
  userId,
  onClose,
}: NodeActionSheetProps) => {
  const { mutate } = useMutation();
  const { colors } = useTheme();

  const handleDelete = () => {
    if (!nodeId) return;

    Alert.alert(
      'Delete',
      `Are you sure you want to delete "${nodeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            mutate({
              input: {
                type: 'node.delete',
                userId,
                nodeId,
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
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>
        {nodeName}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
        onPress={handleDelete}
      >
        <Feather name="trash-2" size={20} color={colors.error} />
        <Text style={[styles.destructiveText, { color: colors.error }]}>Delete</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.cancelAction,
          { borderTopColor: colors.border },
          pressed && { backgroundColor: colors.surfaceHover },
        ]}
        onPress={onClose}
      >
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  destructiveText: {
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
