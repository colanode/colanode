import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

export default function CreateWorkspaceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
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
    if (!accountId) return;

    setError('');
    mutate({
      input: {
        type: 'workspace.create',
        name: trimmedName,
        description: description.trim(),
        accountId,
        avatar: null,
      },
      onSuccess() {
        router.replace('/(app)/(home)');
      },
      onError(err) {
        Alert.alert('Error', err.message);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AnimatedLogo size={60} />
          <Text style={[styles.title, { color: colors.text }]}>
            Setup your workspace
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create a workspace for your team to collaborate
          </Text>
        </View>
        <View style={styles.form}>
          <TextInput
            label="Workspace Name"
            placeholder="My Workspace"
            value={name}
            onChangeText={setName}
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
            title="Create Workspace"
            onPress={handleCreate}
            loading={isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    gap: 8,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
