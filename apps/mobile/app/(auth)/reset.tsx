import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { PasswordResetCompleteForm } from '@colanode/mobile/components/auth/password-reset-complete-form';
import { PasswordResetInitForm } from '@colanode/mobile/components/auth/password-reset-init-form';
import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

type ResetState =
  | { type: 'init' }
  | { type: 'complete'; id: string; expiresAt: string }
  | { type: 'success' };

export default function ResetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { server } = useLocalSearchParams<{ server: string }>();
  const [state, setState] = useState<ResetState>({ type: 'init' });

  const { mutate: mutateInit, isPending: isInitPending } = useMutation();
  const { mutate: mutateComplete, isPending: isCompletePending } =
    useMutation();

  const handleInitSubmit = (values: { email: string }) => {
    if (isInitPending || isCompletePending) return;
    if (!server) return;

    mutateInit({
      input: {
        type: 'email.password.reset.init',
        email: values.email,
        server,
      },
      onSuccess(output) {
        setState({
          type: 'complete',
          id: output.id,
          expiresAt: output.expiresAt,
        });
      },
      onError(error) {
        Alert.alert('Error', error.message);
      },
    });
  };

  const handleCompleteSubmit = (values: {
    otp: string;
    password: string;
  }) => {
    if (isCompletePending || isInitPending) return;
    if (state.type !== 'complete' || !server) return;

    mutateComplete({
      input: {
        type: 'email.password.reset.complete',
        otp: values.otp,
        password: values.password,
        server,
        id: state.id,
      },
      onSuccess() {
        setState({ type: 'success' });
      },
      onError(error) {
        Alert.alert('Error', error.message);
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
            {state.type === 'success'
              ? 'Password reset successful'
              : 'Reset your password'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {state.type === 'init'
              ? 'Enter your email to receive a reset code'
              : state.type === 'complete'
                ? 'Enter the code and your new password'
                : 'You can now login with your new password'}
          </Text>
        </View>

        {state.type === 'init' && (
          <View style={styles.form}>
            <PasswordResetInitForm
              onSubmit={handleInitSubmit}
              isPending={isInitPending}
            />
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Back to login
              </Text>
            </Pressable>
          </View>
        )}

        {state.type === 'complete' && (
          <View style={styles.form}>
            <PasswordResetCompleteForm
              onSubmit={handleCompleteSubmit}
              isPending={isCompletePending}
              expiresAt={state.expiresAt}
            />
            <Pressable onPress={() => setState({ type: 'init' })}>
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Back to email input
              </Text>
            </Pressable>
          </View>
        )}

        {state.type === 'success' && (
          <View style={styles.form}>
            <View style={[styles.successBox, { borderColor: colors.border }]}>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                Your password has been reset. You can now login with your new
                password.
              </Text>
              <Text style={[styles.successNote, { color: colors.textSecondary }]}>
                You have been logged out of all devices.
              </Text>
            </View>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { server },
                })
              }
            >
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Back to login
              </Text>
            </Pressable>
          </View>
        )}
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
  link: {
    fontSize: 14,
    textAlign: 'center',
  },
  successBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successNote: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
