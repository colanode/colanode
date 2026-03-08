import Feather from '@expo/vector-icons/Feather';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />

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
