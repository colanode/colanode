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
  View,
} from 'react-native';

import { AvatarPicker } from '@colanode/mobile/components/avatars/avatar-picker';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { accountId } = useWorkspace();
  const { mutate, isPending } = useMutation();
  const { mutate: mutateAvatar } = useMutation();

  const { data: accounts } = useLiveQuery({ type: 'account.list' });
  const account = accounts?.find((a) => a.id === accountId);

  const [name, setName] = useState(account?.name ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }

    setError('');
    mutate({
      input: {
        type: 'account.update',
        id: accountId,
        name: trimmed,
        avatar: undefined,
      },
      onSuccess() {
        Alert.alert('Success', 'Profile updated');
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
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              {'\u2039'} Back
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Account
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.form}>
          <AvatarPicker
            currentName={account?.name ?? 'User'}
            currentAvatar={account?.avatar ?? null}
            accountId={accountId}
            onAvatarUploaded={(avatarId) => {
              mutateAvatar({
                input: {
                  type: 'account.update',
                  id: accountId,
                  name: name.trim() || account?.name || 'User',
                  avatar: avatarId,
                },
              });
            }}
          />
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            error={error}
            autoCapitalize="words"
          />
          <View style={styles.readOnly}>
            <Text style={[styles.readOnlyLabel, { color: colors.text }]}>
              Email
            </Text>
            <Text
              style={[
                styles.readOnlyValue,
                {
                  backgroundColor: colors.surface,
                  color: colors.textMuted,
                },
              ]}
            >
              {account?.email ?? ''}
            </Text>
          </View>
          <Button
            title="Save"
            onPress={handleSave}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backText: {
    fontSize: 16,
    width: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  form: {
    paddingHorizontal: 16,
    gap: 20,
  },
  readOnly: {
    gap: 6,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  readOnlyValue: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    overflow: 'hidden',
  },
});
