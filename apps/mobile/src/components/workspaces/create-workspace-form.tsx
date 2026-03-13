import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { WorkspaceCreateMutationOutput } from '@colanode/client/mutations';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

interface CreateWorkspaceFormProps {
  accountId?: string;
  onCreated?: (output: WorkspaceCreateMutationOutput) => void | Promise<void>;
  submitLabel?: string;
}

export const CreateWorkspaceForm = ({
  accountId,
  onCreated,
  submitLabel = 'Create Workspace',
}: CreateWorkspaceFormProps) => {
  const { mutate, isPending } = useMutation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Workspace name is required');
      return;
    }

    if (!accountId) {
      Alert.alert('Error', 'Account not found.');
      return;
    }

    setError('');
    mutate({
      input: {
        type: 'workspace.create',
        name: trimmedName,
        description: description.trim(),
        accountId,
        avatar: null,
      },
      onSuccess(output) {
        void Promise.resolve(onCreated?.(output)).catch((error) => {
          console.error('Failed to finish workspace creation flow:', error);
          Alert.alert(
            'Workspace Created',
            'The workspace was created, but finishing setup failed.'
          );
        });
      },
      onError(mutationError) {
        Alert.alert('Error', mutationError.message);
      },
    });
  };

  return (
    <View style={styles.form}>
      <TextInput
        label="Workspace Name"
        placeholder="My Workspace"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (error) {
            setError('');
          }
        }}
        error={error}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TextInput
        label="Description (optional)"
        placeholder="What is this workspace for?"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.textarea}
      />
      <Button
        title={submitLabel}
        onPress={handleCreate}
        loading={isPending}
        disabled={!name.trim()}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 4,
  },
});
