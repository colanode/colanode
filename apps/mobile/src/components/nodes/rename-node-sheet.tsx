import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LocalNode } from '@colanode/client/types/nodes';
import { NodeAttributes } from '@colanode/core';
import { AvatarPickerSheet } from '@colanode/mobile/components/nodes/avatar-picker-sheet';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const PICKER_HEIGHT = Dimensions.get('window').height * 0.6;

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
  database: 'Database',
};

const buildAttributes = (
  node: LocalNode,
  newName: string,
  newAvatar: string | null | undefined
): NodeAttributes => {
  switch (node.type) {
    case 'space':
      return {
        type: 'space',
        name: newName,
        description: node.description,
        avatar: newAvatar ?? null,
        collaborators: node.collaborators,
        visibility: node.visibility,
      };
    case 'channel':
      return {
        type: 'channel',
        name: newName,
        avatar: newAvatar ?? null,
        parentId: node.parentId!,
      };
    case 'page':
      return {
        type: 'page',
        name: newName,
        avatar: newAvatar ?? null,
        parentId: node.parentId!,
      };
    case 'folder':
      return {
        type: 'folder',
        name: newName,
        avatar: newAvatar ?? null,
        parentId: node.parentId!,
      };
    case 'database':
      return {
        type: 'database',
        name: newName,
        avatar: newAvatar ?? null,
        parentId: node.parentId!,
        fields: node.fields ?? {},
        nameField: node.nameField ?? null,
        locked: node.locked ?? null,
      };
    default:
      throw new Error(`Unsupported node type for rename: ${node.type}`);
  }
};

const getNodeAvatar = (node: LocalNode): string | null => {
  if ('avatar' in node) {
    return (node as { avatar?: string | null }).avatar ?? null;
  }
  return null;
};

export const RenameNodeSheet = ({
  visible,
  node,
  userId,
  onClose,
  onRenamed,
}: RenameNodeSheetProps) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const { mutate, isPending } = useMutation();
  const { colors } = useTheme();
  const toast = useToast();

  useEffect(() => {
    if (visible && node && (node.type === 'space' || node.type === 'channel' || node.type === 'page' || node.type === 'folder' || node.type === 'database')) {
      setName(node.name ?? '');
      setAvatar(getNodeAvatar(node));
      setShowAvatarPicker(false);
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
        attributes: buildAttributes(node, trimmed, avatar),
      },
      onSuccess() {
        onClose();
        onRenamed?.();
      },
      onError(error) {
        toast.show(error.message);
      },
    });
  };

  const handleAvatarSelect = (avatarId: string | null) => {
    setAvatar(avatarId);
    setShowAvatarPicker(false);
  };

  const typeLabel = node ? (NODE_TYPE_LABELS[node.type] ?? 'Item') : 'Item';

  return (
    <BottomSheet
      visible={visible}
      onClose={showAvatarPicker ? () => setShowAvatarPicker(false) : onClose}
      avoidKeyboard={!showAvatarPicker}
      maxHeight={showAvatarPicker ? '75%' : undefined}
    >
      {showAvatarPicker ? (
        <View style={{ height: PICKER_HEIGHT }}>
          <AvatarPickerSheet
            currentAvatar={avatar}
            onSelect={handleAvatarSelect}
            onBack={() => setShowAvatarPicker(false)}
          />
        </View>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Edit {typeLabel}</Text>
          <Pressable
            style={[styles.iconButton, { borderColor: colors.border }]}
            onPress={() => setShowAvatarPicker(true)}
          >
            <NodeIcon type={node?.type ?? 'page'} avatar={avatar} size={28} />
            <View style={[styles.editBadge, { backgroundColor: colors.surface }]}>
              <Feather name="edit-2" size={10} color={colors.textSecondary} />
            </View>
          </Pressable>
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
        </>
      )}
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
  iconButton: {
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
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
