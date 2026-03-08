import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Server } from '@colanode/client/types';
import { ServerCard } from '@colanode/mobile/components/auth/server-card';
import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';

export default function ServerSelectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: servers } = useLiveQuery({ type: 'server.list' });

  const handleSelectServer = (server: Server) => {
    router.push({
      pathname: '/(auth)/login',
      params: { server: server.domain },
    });
  };

  const handleAddServer = () => {
    router.push('/(auth)/server-add');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <AnimatedLogo size={80} />
        <Text style={[styles.title, { color: colors.text }]}>Colanode</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {servers && servers.length > 0
            ? 'Select a server to continue'
            : 'Add a server to get started'}
        </Text>
      </View>
      <FlatList
        data={servers ?? []}
        keyExtractor={(item) => item.domain}
        renderItem={({ item }) => (
          <ServerCard server={item} onSelect={handleSelectServer} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="No servers"
            subtitle="Add a server to connect to your workspace"
          />
        }
      />
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { borderColor: colors.borderSubtle },
          pressed && { backgroundColor: colors.surface },
        ]}
        onPress={handleAddServer}
      >
        <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
          + Add Server
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    flexGrow: 1,
  },
  separator: {
    height: 8,
  },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
