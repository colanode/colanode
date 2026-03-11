import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accountId } = useWorkspace();
  const { mutate, isPending } = useMutation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canCreate = name.trim().length >= 3 && !isPending;

  const handleCreate = () => {
    if (!canCreate) return;

    mutate({
      input: {
        type: 'workspace.create',
        name: name.trim(),
        description: description.trim(),
        accountId,
        avatar: null,
      },
      async onSuccess(output) {
        // Set the new workspace as selected
        mutate({
          input: {
            type: 'metadata.update',
            namespace: 'app',
            key: 'workspace',
            value: JSON.stringify(output.userId),
          },
        });

        await queryClient.cancelQueries();
        queryClient.clear();
        router.replace('/(app)/(home)');
      },
      onError(error) {
        Alert.alert('Error', error.message);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Workspace</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceHover,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Workspace name (min 3 characters)"
            placeholderTextColor={colors.textPlaceholder}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.surfaceHover,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Optional description"
            placeholderTextColor={colors.textPlaceholder}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            { backgroundColor: colors.primary },
            !canCreate && { backgroundColor: colors.borderSubtle },
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreate}
          disabled={!canCreate}
        >
          <Text style={[styles.createButtonText, { color: colors.text }]}>
            {isPending ? 'Creating...' : 'Create Workspace'}
          </Text>
        </Pressable>
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  content: {
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
  createButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
