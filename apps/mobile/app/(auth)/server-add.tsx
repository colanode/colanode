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

import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

export default function ServerAddScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { mutate, isPending } = useMutation();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Server URL is required');
      return;
    }

    setError('');
    mutate({
      input: {
        type: 'server.create',
        url: trimmed,
      },
      onSuccess() {
        router.back();
      },
      onError(err) {
        Alert.alert('Connection Failed', err.message);
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
          <Text style={[styles.title, { color: colors.text }]}>Add Server</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the URL of your Colanode server
          </Text>
        </View>
        <View style={styles.form}>
          <TextInput
            label="Server URL"
            placeholder="http://your-server.com/config"
            value={url}
            onChangeText={setUrl}
            error={error}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
          />
          <Button
            title="Connect"
            onPress={handleConnect}
            loading={isPending}
          />
        </View>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
  },
});
