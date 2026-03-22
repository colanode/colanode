import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { useQuery } from '@colanode/mobile/hooks/use-query';

export default function NewChatScreen() {
  const router = useRouter();
  const { userId } = useWorkspace();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { mutate, isPending } = useMutation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  const { data: users } = useQuery({
    type: 'user.search',
    searchQuery: debouncedSearch,
    userId,
    exclude: [userId],
  });

  const handleSelectUser = (collaboratorId: string) => {
    if (isPending) return;

    mutate({
      input: {
        type: 'chat.create',
        userId,
        collaboratorId,
      },
      onSuccess(output) {
        router.replace({
          pathname: '/(app)/(chats)/[chatId]',
          params: { chatId: output.id },
        });
      },
      onError(error) {
        Alert.alert('Error', error.message);
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>New Chat</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
          autoFocus
          style={styles.searchInput}
        />
      </View>
      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.userRow,
              pressed && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleSelectUser(item.id)}
          >
            <UserAvatar
              name={item.customName ?? item.name}
              avatar={item.avatar}
              size={40}
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {item.customName ?? item.name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No users found</Text>
        }
      />
    </View>
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
  },
  backText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    borderWidth: 0,
  },
  list: {
    flexGrow: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 40,
  },
});
