import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { generateId, hasWorkspaceRole, IdType } from '@colanode/core';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

export default function CreateSpaceScreen() {
  const router = useRouter();
  const { userId, role } = useWorkspace();
  const { mutate, isPending } = useMutation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const canCreateSpace = hasWorkspaceRole(role, 'collaborator');

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName || !canCreateSpace) return;

    const nodeId = generateId(IdType.Space);

    mutate({
      input: {
        type: 'node.create',
        userId,
        nodeId,
        attributes: {
          type: 'space',
          name: trimmedName,
          description: description.trim() || null,
          collaborators: { [userId]: 'admin' },
          visibility: 'private',
        },
      },
      onSuccess() {
        router.back();
      },
      onError(error) {
        toast.show(error.message);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Space</Text>
        <Pressable
          onPress={handleCreate}
          disabled={!name.trim() || isPending || !canCreateSpace}
        >
          <Text
            style={[
              styles.createText,
              { color: colors.primary },
              (!name.trim() || isPending || !canCreateSpace) && {
                color: colors.borderSubtle,
              },
            ]}
          >
            {isPending ? 'Creating...' : 'Create'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="Space name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="What's this space about?"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
        </View>
        {!canCreateSpace && (
          <Text style={[styles.permissionNote, { color: colors.textMuted }]}>
            You do not have permission to create spaces in this workspace.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  permissionNote: {
    fontSize: 14,
    lineHeight: 20,
  },
});
