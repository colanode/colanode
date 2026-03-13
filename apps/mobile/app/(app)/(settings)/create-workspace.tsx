import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { CreateWorkspaceForm } from '@colanode/mobile/components/workspaces/create-workspace-form';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { appService } = useAppService();
  const { accountId } = useWorkspace();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Workspace</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <CreateWorkspaceForm
          accountId={accountId}
          onCreated={async (output) => {
            await appService.metadata.set('app', 'workspace', output.userId);
            await queryClient.cancelQueries();
            queryClient.clear();
            router.replace('/(app)/(home)');
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
});
