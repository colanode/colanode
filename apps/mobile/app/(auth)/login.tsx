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
import { EmailLoginForm } from '@colanode/mobile/components/auth/email-login-form';
import { EmailVerifyForm } from '@colanode/mobile/components/auth/email-verify-form';
import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

type LoginState =
  | { type: 'login' }
  | { type: 'verify'; id: string; expiresAt: string };

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { server } = useLocalSearchParams<{ server: string }>();
  const [state, setState] = useState<LoginState>({ type: 'login' });

  const { mutate: mutateLogin, isPending: isLoginPending } = useMutation();
  const { mutate: mutateVerify, isPending: isVerifyPending } = useMutation();

  const handleLoginSuccess = (output: LoginOutput) => {
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

  const handleLoginSubmit = (values: {
    email: string;
    password: string;
  }) => {
    if (isLoginPending || isVerifyPending) return;
    if (!server) return;

    mutateLogin({
      input: {
        type: 'email.login',
        email: values.email,
        password: values.password,
        server,
      },
      onSuccess: handleLoginSuccess,
      onError(error) {
        Alert.alert('Login Failed', error.message);
      },
    });
  };

  const handleVerifySubmit = (values: { otp: string }) => {
    if (isVerifyPending || isLoginPending) return;
    if (state.type !== 'verify' || !server) return;

    mutateVerify({
      input: {
        type: 'email.verify',
        otp: values.otp,
        server,
        id: state.id,
      },
      onSuccess: handleLoginSuccess,
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
            {state.type === 'login'
              ? 'Login to your account'
              : 'Verify your email'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {state.type === 'login'
              ? `Sign in to ${server ?? 'server'}`
              : 'Enter the code sent to your email'}
          </Text>
        </View>

        {state.type === 'login' && (
          <View style={styles.form}>
            <EmailLoginForm
              onSubmit={handleLoginSubmit}
              isPending={isLoginPending}
            />
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(auth)/register',
                  params: { server },
                })
              }
            >
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                No account yet? Register
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(auth)/reset',
                  params: { server },
                })
              }
            >
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Forgot password?
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
            <Pressable onPress={() => setState({ type: 'login' })}>
              <Text style={[styles.link, { color: colors.textSecondary }]}>
                Back to login
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.link, { color: colors.textSecondary }]}>
            Back to servers
          </Text>
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
