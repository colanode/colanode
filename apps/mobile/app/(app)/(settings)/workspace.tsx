import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker } from '@colanode/mobile/components/avatars/avatar-picker';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

export default function WorkspaceSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId, accountId, workspace, role } = useWorkspace();
  const { mutate, isPending } = useMutation();
  const { mutate: mutateAvatar } = useMutation();
  const toast = useToast();

  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(
    workspace.description ?? ''
  );
  const [error, setError] = useState('');

  const canEdit = role === 'owner' || role === 'admin';

  useEffect(() => {
    setName(workspace.name);
    setDescription(workspace.description ?? '');
  }, [workspace.workspaceId, workspace.name, workspace.description]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }

    setError('');
    mutate({
      input: {
        type: 'workspace.update',
        userId,
        name: trimmed,
        description: description.trim(),
        avatar: workspace.avatar ?? null,
      },
      onSuccess() {
        toast.show('Workspace updated', 'success');
      },
      onError(err) {
        toast.show(err.message);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <BackButton onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Workspace
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.form}>
          {canEdit && (
            <AvatarPicker
              currentName={workspace.name}
              currentAvatar={workspace.avatar ?? null}
              accountId={accountId}
              onAvatarUploaded={(avatarId) => {
                mutateAvatar({
                  input: {
                    type: 'workspace.update',
                    userId,
                    name: workspace.name,
                    description: workspace.description ?? '',
                    avatar: avatarId,
                  },
                });
              }}
            />
          )}
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            error={error}
            editable={canEdit}
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            editable={canEdit}
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
          {canEdit && (
            <Button
              title="Save"
              onPress={handleSave}
              loading={isPending}
            />
          )}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  form: {
    paddingHorizontal: 16,
    gap: 20,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
