import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NodeRole } from '@colanode/core';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { useQuery } from '@colanode/mobile/hooks/use-query';

const ROLE_OPTIONS: Array<{ value: NodeRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'viewer', label: 'Viewer' },
];

interface SpaceAddCollaboratorSheetProps {
  visible: boolean;
  onClose: () => void;
  spaceId: string;
  userId: string;
  existingCollaboratorIds: string[];
}

export const SpaceAddCollaboratorSheet = ({
  visible,
  onClose,
  spaceId,
  userId,
  existingCollaboratorIds,
}: SpaceAddCollaboratorSheetProps) => {
  const { colors } = useTheme();
  const { mutate, isPending } = useMutation();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<NodeRole>('editor');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setDebouncedSearch('');
      setRole('editor');
    }
  }, [visible]);

  const { data: users } = useQuery(
    {
      type: 'user.search',
      searchQuery: debouncedSearch,
      userId,
      exclude: existingCollaboratorIds,
    },
    {
      enabled: visible && debouncedSearch.length > 1,
    }
  );

  const handleSelectUser = (collaboratorId: string) => {
    if (isPending) return;

    mutate({
      input: {
        type: 'node.collaborator.create',
        userId,
        nodeId: spaceId,
        collaboratorIds: [collaboratorId],
        role,
      },
      onSuccess() {
        onClose();
      },
      onError(error) {
        toast.show(error.message);
      },
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      avoidKeyboard
      maxHeight="80%"
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Add collaborator
      </Text>

      <View style={styles.roleSection}>
        <Text style={[styles.roleLabel, { color: colors.textMuted }]}>
          Role
        </Text>
        <View style={styles.roleOptions}>
          {ROLE_OPTIONS.map((r) => (
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

      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.userRow,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            disabled={isPending}
            onPress={() => handleSelectUser(item.id)}
          >
            <UserAvatar
              name={item.customName ?? item.name}
              avatar={item.avatar}
              size={40}
            />
            <View style={styles.userInfo}>
              <Text
                style={[styles.userName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.customName ?? item.name}
              </Text>
              <Text
                style={[styles.userEmail, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            </View>
          </Pressable>
        )}
        style={styles.userList}
        contentContainerStyle={styles.userListContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          search.trim().length > 1 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No users found
            </Text>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Type to search for users
            </Text>
          )
        }
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  roleSection: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  userList: {
    maxHeight: 300,
  },
  userListContent: {
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
    fontSize: 15,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
  },
});
