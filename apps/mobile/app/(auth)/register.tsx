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

import { LoginOutput } from '@colanode/core';
import { EmailRegisterForm } from '@colanode/mobile/components/auth/email-register-form';
import { EmailVerifyForm } from '@colanode/mobile/components/auth/email-verify-form';
import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

type RegisterState =
  | { type: 'register' }
  | { type: 'verify'; id: string; expiresAt: string };

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { server } = useLocalSearchParams<{ server: string }>();
  const [state, setState] = useState<RegisterState>({ type: 'register' });

  const { mutate: mutateRegister, isPending: isRegisterPending } =
    useMutation();
  const { mutate: mutateVerify, isPending: isVerifyPending } = useMutation();

  const handleRegisterSuccess = (output: LoginOutput) => {
    if (output.type === 'success') {
      if (output.workspaces.length > 0) {
        router.replace('/(app)/(home)');
      } else {
        router.replace({
          pathname: '/(auth)/create-workspace',
          params: { accountId: output.account.id },
        });
      }
    } else if (output.type === 'verify') {
      setState({
        type: 'verify',
        id: output.id,
        expiresAt: output.expiresAt,
      });
    }
  };

  const handleRegisterSubmit = (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    if (isRegisterPending || isVerifyPending) return;
    if (!server) return;

    mutateRegister({
      input: {
        type: 'email.register',
        name: values.name,
        email: values.email,
        password: values.password,
        server,
      },
      onSuccess: handleRegisterSuccess,
      onError(error) {
        Alert.alert('Registration Failed', error.message);
      },
    });
  };

  const handleVerifySubmit = (values: { otp: string }) => {
    if (isVerifyPending || isRegisterPending) return;
    if (state.type !== 'verify' || !server) return;

    mutateVerify({
      input: {
        type: 'email.verify',
        otp: values.otp,
        server,
        id: state.id,
      },
      onSuccess: handleRegisterSuccess,
      onError(error) {
        Alert.alert('Verification Failed', error.message);
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
            {state.type === 'register'
              ? 'Create an account'
              : 'Verify your email'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {state.type === 'register'
              ? `Sign up on ${server ?? 'server'}`
              : 'Enter the code sent to your email'}
          </Text>
        </View>

        {state.type === 'register' && (
          <View style={styles.form}>
            <EmailRegisterForm
              onSubmit={handleRegisterSubmit}
              isPending={isRegisterPending}
            />
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { server },
                })
              }
            >
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Already have an account? Login
              </Text>
            </Pressable>
          </View>
        )}

        {state.type === 'verify' && (
          <View style={styles.form}>
            <EmailVerifyForm
              onSubmit={handleVerifySubmit}
              isPending={isVerifyPending}
              expiresAt={state.expiresAt}
            />
            <Pressable onPress={() => setState({ type: 'register' })}>
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Back to register
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.link, { color: colors.textSecondary }]}>Back</Text>
        </Pressable>
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
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
});
