import Feather from '@expo/vector-icons/Feather';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NodeRole } from '@colanode/core';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

const NODE_ROLE_OPTIONS: Array<{
  value: NodeRole;
  label: string;
  description: string;
}> = [
  { value: 'admin', label: 'Admin', description: 'Administration access' },
  { value: 'editor', label: 'Editor', description: 'Editing access' },
  {
    value: 'collaborator',
    label: 'Collaborator',
    description: 'Can create records, messages or comments',
  },
  { value: 'viewer', label: 'Viewer', description: 'Can view content' },
];

interface SpaceCollaboratorRoleSheetProps {
  visible: boolean;
  onClose: () => void;
  spaceId: string;
  userId: string;
  collaborator: {
    id: string;
    name: string;
    currentRole: NodeRole;
  } | null;
  canEdit: boolean;
  canRemove: boolean;
}

export const SpaceCollaboratorRoleSheet = ({
  visible,
  onClose,
  spaceId,
  userId,
  collaborator,
  canEdit,
  canRemove,
}: SpaceCollaboratorRoleSheetProps) => {
  const { colors } = useTheme();
  const { mutate, isPending } = useMutation();
  const toast = useToast();

  const handleRoleChange = (role: NodeRole) => {
    if (!collaborator || isPending || !canEdit) return;
    if (role === collaborator.currentRole) {
      onClose();
      return;
    }

    mutate({
      input: {
        type: 'node.collaborator.update',
        userId,
        nodeId: spaceId,
        collaboratorId: collaborator.id,
        role,
      },
      onSuccess() {
        onClose();
      },
      onError(error) {
        toast.show(error.message);
      },
    });
  };

  const handleRemove = () => {
    if (!collaborator || isPending || !canRemove) return;

    Alert.alert(
      'Remove collaborator',
      `Remove ${collaborator.name} from this space?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            mutate({
              input: {
                type: 'node.collaborator.delete',
                userId,
                nodeId: spaceId,
                collaboratorId: collaborator.id,
              },
              onSuccess() {
                onClose();
              },
              onError(error) {
                toast.show(error.message);
              },
            });
          },
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="70%">
      <Text style={[styles.title, { color: colors.text }]}>Change Role</Text>
      {collaborator && (
        <>
          <Text
            style={[styles.subtitle, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {collaborator.name}
          </Text>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {NODE_ROLE_OPTIONS.map((option) => {
              const isSelected = collaborator.currentRole === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.option,
                    pressed &&
                      canEdit &&
                      !isPending && {
                        backgroundColor: colors.surfaceHover,
                      },
                  ]}
                  disabled={!canEdit || isPending}
                  onPress={() => handleRoleChange(option.value)}
                >
                  <View style={styles.optionInfo}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: canEdit ? colors.text : colors.textMuted },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.optionDescription, { color: colors.textMuted }]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  {isPending && isSelected ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : isSelected ? (
                    <Feather name="check" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {canRemove && (
            <Pressable
              style={({ pressed }) => [
                styles.removeAction,
                { borderTopColor: colors.border },
                pressed && !isPending && { backgroundColor: colors.surfaceHover },
              ]}
              disabled={isPending}
              onPress={handleRemove}
            >
              <Feather name="user-minus" size={18} color={colors.error} />
              <Text style={[styles.removeText, { color: colors.error }]}>
                Remove from space
              </Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.cancelAction,
              { borderTopColor: colors.border },
              pressed && !isPending && { backgroundColor: colors.surfaceHover },
            ]}
            disabled={isPending}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 13,
  },
  removeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  removeText: {
    fontSize: 16,
  },
  cancelAction: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelText: {
    fontSize: 16,
  },
});
