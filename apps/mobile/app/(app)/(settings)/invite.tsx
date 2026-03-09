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

import { WorkspaceRole } from '@colanode/core';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

const ROLES: { value: WorkspaceRole; label: string }[] = [
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'admin', label: 'Admin' },
  { value: 'guest', label: 'Guest' },
];

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function InviteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId } = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<WorkspaceRole>('collaborator');
  const [error, setError] = useState('');

  const addEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmed)) {
      setError('This email has already been added');
      return;
    }

    setEmails((prev) => [...prev, trimmed]);
    setEmail('');
    setError('');
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleInvite = () => {
    // If there's text in the input, try adding it first
    const trimmed = email.trim().toLowerCase();
    let allEmails = [...emails];

    if (trimmed) {
      if (!isValidEmail(trimmed)) {
        setError('Please enter a valid email address');
        return;
      }
      if (!allEmails.includes(trimmed)) {
        allEmails = [...allEmails, trimmed];
      }
    }

    if (allEmails.length === 0) {
      setError('Add at least one email address');
      return;
    }

    setError('');
    mutate({
      input: {
        type: 'users.create',
        userId,
        users: allEmails.map((e) => ({ email: e, role })),
      },
      onSuccess(output) {
        const successCount = output.users.length;
        const errorCount = output.errors.length;

        if (errorCount > 0 && successCount === 0) {
          const errorMessages = output.errors
            .map((e) => `${e.email}: ${e.error}`)
            .join('\n');
          Alert.alert('Invitation Failed', errorMessages);
        } else if (errorCount > 0) {
          const errorMessages = output.errors
            .map((e) => `${e.email}: ${e.error}`)
            .join('\n');
          Alert.alert(
            'Partial Success',
            `${successCount} invited successfully.\n\nFailed:\n${errorMessages}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert(
            'Success',
            `${successCount} member${successCount !== 1 ? 's' : ''} invited`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
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
          <BackButton onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Invite Members
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.form}>
          <View style={styles.emailInputRow}>
            <View style={styles.emailInputWrapper}>
              <TextInput
                label="Email Address"
                placeholder="user@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                error={error}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={addEmail}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addEmailButton,
                { backgroundColor: colors.primary },
                pressed && styles.addEmailButtonPressed,
              ]}
              onPress={addEmail}
            >
              <Text style={[styles.addEmailButtonText, { color: colors.text }]}>
                Add
              </Text>
            </Pressable>
          </View>

          {emails.length > 0 && (
            <View style={styles.emailChips}>
              {emails.map((e) => (
                <View
                  key={e}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.surfaceHover,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                    {e}
                  </Text>
                  <Pressable
                    onPress={() => removeEmail(e)}
                    hitSlop={8}
                  >
                    <Text style={[styles.chipRemove, { color: colors.textMuted }]}>
                      x
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.roleSection}>
            <Text style={[styles.roleLabel, { color: colors.text }]}>Role</Text>
            <View style={styles.roleOptions}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    role === r.value && {
                      borderColor: colors.primary,
                      backgroundColor: colors.surfaceAccent,
                    },
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      { color: colors.textSecondary },
                      role === r.value && { color: colors.primary },
                    ]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button
            title={`Invite ${emails.length > 0 ? `(${emails.length})` : ''}`}
            onPress={handleInvite}
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
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emailInputWrapper: {
    flex: 1,
  },
  addEmailButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
  },
  addEmailButtonPressed: {
    opacity: 0.8,
  },
  addEmailButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emailChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    maxWidth: 200,
  },
  chipRemove: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleSection: {
    gap: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
