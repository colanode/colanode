import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { CreateWorkspaceForm } from '@colanode/mobile/components/workspaces/create-workspace-form';
import { useTheme } from '@colanode/mobile/contexts/theme';

export default function CreateWorkspaceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();

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
        <CreateWorkspaceForm
          accountId={accountId}
          onCreated={() => router.replace('/(app)/(home)')}
        />
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
});
