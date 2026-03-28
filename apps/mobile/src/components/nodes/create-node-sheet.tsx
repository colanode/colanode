import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { generateId, IdType } from '@colanode/core';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export type CreatableNodeType = 'channel' | 'page' | 'folder';

const NODE_TYPE_CONFIG: Record<
  CreatableNodeType,
  { label: string; icon: keyof typeof Feather.glyphMap; idType: IdType }
> = {
  channel: { label: 'Channel', icon: 'hash', idType: IdType.Channel },
  page: { label: 'Page', icon: 'file-text', idType: IdType.Page },
  folder: { label: 'Folder', icon: 'folder', idType: IdType.Folder },
};

interface CreateNodeSheetProps {
  visible: boolean;
  parentId: string;
  userId: string;
  allowedTypes?: CreatableNodeType[];
  onClose: () => void;
}

export const CreateNodeSheet = ({
  visible,
  parentId,
  userId,
  allowedTypes = ['channel', 'page', 'folder'],
  onClose,
}: CreateNodeSheetProps) => {
  const [selectedType, setSelectedType] = useState<CreatableNodeType>(allowedTypes[0]!);
  const [name, setName] = useState('');
  const { mutate, isPending } = useMutation();
  const { colors } = useTheme();
  const toast = useToast();

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const config = NODE_TYPE_CONFIG[selectedType];
    const nodeId = generateId(config.idType);

    mutate({
      input: {
        type: 'node.create',
        userId,
        nodeId,
        attributes: {
          type: selectedType,
          name: trimmedName,
          parentId,
        },
      },
      onSuccess() {
        setName('');
        onClose();
      },
      onError(error) {
        toast.show(error.message);
      },
    });
  };

  const handleClose = () => {
    setName('');
    setSelectedType(allowedTypes[0]!);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} avoidKeyboard>
      <Text style={[styles.title, { color: colors.text }]}>Create New</Text>

      <View style={styles.typeRow}>
        {allowedTypes.map((type) => {
          const config = NODE_TYPE_CONFIG[type];
          const isSelected = type === selectedType;
          return (
            <Pressable
              key={type}
              style={[
                styles.typeButton,
                { backgroundColor: colors.surfaceHover, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, backgroundColor: colors.surfaceAccent },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Feather
                name={config.icon}
                size={28}
                color={isSelected ? colors.text : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeLabel,
                  { color: colors.textSecondary },
                  isSelected && { color: colors.text },
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.text }]}
          placeholder={`${NODE_TYPE_CONFIG[selectedType].label} name`}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={100}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          { backgroundColor: colors.primary },
          (!name.trim() || isPending) && { backgroundColor: colors.borderSubtle },
          pressed && styles.createButtonPressed,
        ]}
        onPress={handleCreate}
        disabled={!name.trim() || isPending}
      >
        <Text style={[styles.createButtonText, { color: colors.text }]}>
          {isPending ? 'Creating...' : `Create ${NODE_TYPE_CONFIG[selectedType].label}`}
        </Text>
      </Pressable>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  createButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
