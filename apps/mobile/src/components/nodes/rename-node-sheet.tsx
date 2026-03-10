import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NodeAttributes } from '@colanode/core';
import { LocalNode } from '@colanode/client/types/nodes';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

interface RenameNodeSheetProps {
  visible: boolean;
  node: LocalNode | null;
  userId: string;
  onClose: () => void;
  onRenamed?: () => void;
}

const NODE_TYPE_LABELS: Record<string, string> = {
  space: 'Space',
  channel: 'Channel',
  page: 'Page',
  folder: 'Folder',
};

const buildAttributes = (node: LocalNode, newName: string): NodeAttributes => {
  switch (node.type) {
    case 'space':
      return {
        type: 'space',
        name: newName,
        description: node.description,
        avatar: node.avatar,
        collaborators: node.collaborators,
        visibility: node.visibility,
      };
    case 'channel':
      return {
        type: 'channel',
        name: newName,
        avatar: node.avatar,
        parentId: node.parentId!,
      };
    case 'page':
      return {
        type: 'page',
        name: newName,
        avatar: node.avatar,
        parentId: node.parentId!,
      };
    case 'folder':
      return {
        type: 'folder',
        name: newName,
        avatar: node.avatar,
        parentId: node.parentId!,
      };
    default:
      throw new Error(`Unsupported node type for rename: ${node.type}`);
  }
};

export const RenameNodeSheet = ({
  visible,
  node,
  userId,
  onClose,
  onRenamed,
}: RenameNodeSheetProps) => {
  const [name, setName] = useState('');
  const { mutate, isPending } = useMutation();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible && node && (node.type === 'space' || node.type === 'channel' || node.type === 'page' || node.type === 'folder')) {
      setName(node.name ?? '');
    }
  }, [visible, node]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || !node) return;

    mutate({
      input: {
        type: 'node.update',
        userId,
        nodeId: node.id,
        attributes: buildAttributes(node, trimmed),
      },
      onSuccess() {
        onClose();
        onRenamed?.();
      },
      onError(error) {
        Alert.alert('Error', error.message);
      },
    });
  };

  const typeLabel = node ? (NODE_TYPE_LABELS[node.type] ?? 'Item') : 'Item';

  return (
    <BottomSheet visible={visible} onClose={onClose} avoidKeyboard>
      <Text style={[styles.title, { color: colors.text }]}>Rename {typeLabel}</Text>
      <View style={styles.form}>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <Button
          title="Save"
          onPress={handleSave}
          loading={isPending}
        />
      </View>
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
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  form: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cancelAction: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
  },
  cancelText: {
    fontSize: 16,
  },
});
