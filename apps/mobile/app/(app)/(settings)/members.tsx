import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { User } from '@colanode/client/types/users';
import { WorkspaceRole } from '@colanode/core';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  collaborator: 'Collaborator',
  guest: 'Guest',
  none: 'No access',
};

const ROLE_OPTIONS: Array<{
  value: WorkspaceRole;
  label: string;
  description: string;
}> = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full access',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Administration access',
  },
  {
    value: 'collaborator',
    label: 'Collaborator',
    description: 'Can contribute to content',
  },
  {
    value: 'guest',
    label: 'Guest',
    description: 'Can view content',
  },
  {
    value: 'none',
    label: 'No access',
    description: 'No access to workspace',
  },
];

export default function MembersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId, accountId, workspaceId, role } = useWorkspace();
  const { mutate, isPending } = useMutation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingRole, setPendingRole] = useState<WorkspaceRole | null>(null);
  const canManageMembers = role === 'owner' || role === 'admin';

  const {
    data: users,
    refetch,
    isRefetching,
  } = useLiveQuery({
    type: 'user.list',
    userId,
  });

  const closeRoleSheet = () => {
    if (isPending) {
      return;
    }

    setSelectedUser(null);
    setPendingRole(null);
  };

  const openRoleSheet = (member: User) => {
    if (!canManageMembers || isPending || member.id === userId) {
      return;
    }

    // Non-owners cannot modify owner roles
    if (member.role === 'owner' && role !== 'owner') {
      return;
    }

    setSelectedUser(member);
    setPendingRole(null);
  };

  const submitRoleUpdate = async (nextRole: WorkspaceRole) => {
    if (!selectedUser || isPending || selectedUser.id === userId) {
      return;
    }

    if (selectedUser.role === nextRole) {
      closeRoleSheet();
      return;
    }

    setPendingRole(nextRole);

    await mutate({
      input: {
        type: 'user.role.update',
        accountId,
        workspaceId,
        userId: selectedUser.id,
        role: nextRole,
      },
      onSuccess() {
        setSelectedUser(null);
        setPendingRole(null);
      },
      onError(error) {
        setPendingRole(null);
        Alert.alert('Error', error.message);
      },
    });
  };

  const handleRoleUpdate = async (nextRole: WorkspaceRole) => {
    if (!selectedUser || isPending) {
      return;
    }

    if (nextRole !== 'none') {
      await submitRoleUpdate(nextRole);
      return;
    }

    Alert.alert(
      'Remove Member',
      `Remove ${selectedUser.name} from this workspace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void submitRoleUpdate(nextRole);
          },
        },
      ]
    );
  };

  const renderUser = (user: User) => {
    const displayName = user.name;
    const canEditRole = canManageMembers && user.id !== userId;
    const isUpdatingUser = isPending && selectedUser?.id === user.id;
    const roleBadge = (
      <View
        style={[
          styles.roleBadgeContent,
          { backgroundColor: colors.surfaceHover },
        ]}
      >
        {isUpdatingUser ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <>
            <Text style={[styles.roleText, { color: colors.textSecondary }]}>
              {ROLE_LABELS[user.role]}
            </Text>
            {canEditRole && (
              <Feather name="chevron-down" size={14} color={colors.textMuted} />
            )}
          </>
        )}
      </View>
    );

    return (
      <View style={styles.userRow}>
        <UserAvatar name={displayName} avatar={user.avatar} size={40} />
        <View style={styles.userInfo}>
          <Text
            style={[styles.userName, { color: colors.text }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={[styles.userEmail, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        </View>
        {canEditRole ? (
          <Pressable
            style={({ pressed }) => [
              styles.roleBadge,
              pressed && !isPending && styles.roleBadgePressed,
            ]}
            disabled={isPending}
            onPress={() => openRoleSheet(user)}
          >
            {roleBadge}
          </Pressable>
        ) : (
          <View style={styles.roleBadge}>{roleBadge}</View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Members
        </Text>
        {canManageMembers ? (
          <Pressable
            onPress={() => router.push('/(app)/(settings)/invite')}
            style={styles.inviteButton}
          >
            <Text style={[styles.inviteButtonText, { color: colors.primary }]}>
              Invite
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderUser(item)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textMuted}
          />
        }
        ListHeaderComponent={
          users && users.length > 0 ? (
            <Text style={[styles.countText, { color: colors.textMuted }]}>
              {users.length} member{users.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
      />
      <BottomSheet
        visible={selectedUser !== null}
        onClose={closeRoleSheet}
        maxHeight="70%"
      >
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          Change Role
        </Text>
        {selectedUser && (
          <>
            <Text
              style={[styles.sheetSubtitle, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {selectedUser.name} · {selectedUser.email}
            </Text>
            <ScrollView
              style={styles.sheetList}
              contentContainerStyle={styles.sheetListContent}
            >
              {ROLE_OPTIONS.filter(
                (roleOption) =>
                  roleOption.value !== 'owner' || role === 'owner'
              ).map((roleOption) => {
                const isSelected = selectedUser.role === roleOption.value;
                const isUpdatingRole =
                  isPending && pendingRole === roleOption.value;

                return (
                  <Pressable
                    key={roleOption.value}
                    style={({ pressed }) => [
                      styles.sheetOption,
                      pressed &&
                        !isPending && {
                          backgroundColor: colors.surfaceHover,
                        },
                    ]}
                    disabled={isPending}
                    onPress={() => void handleRoleUpdate(roleOption.value)}
                  >
                    <View style={styles.sheetOptionInfo}>
                      <Text
                        style={[
                          styles.sheetOptionTitle,
                          { color: colors.text },
                        ]}
                      >
                        {roleOption.label}
                      </Text>
                      <Text
                        style={[
                          styles.sheetOptionDescription,
                          { color: colors.textMuted },
                        ]}
                      >
                        {roleOption.description}
                      </Text>
                    </View>
                    {isUpdatingRole ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : isSelected ? (
                      <Feather name="check" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.sheetCancel,
            { borderTopColor: colors.border },
            pressed && !isPending && { backgroundColor: colors.surfaceHover },
          ]}
          disabled={isPending}
          onPress={closeRoleSheet}
        >
          <Text
            style={[styles.sheetCancelText, { color: colors.textSecondary }]}
          >
            Cancel
          </Text>
        </Pressable>
      </BottomSheet>
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
  inviteButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  list: {
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  roleBadge: {
    borderRadius: 6,
  },
  roleBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgePressed: {
    opacity: 0.8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sheetList: {
    maxHeight: 320,
  },
  sheetListContent: {
    paddingHorizontal: 12,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
  },
  sheetOptionInfo: {
    flex: 1,
    gap: 2,
  },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  sheetOptionDescription: {
    fontSize: 13,
  },
  sheetCancel: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  sheetCancelText: {
    fontSize: 16,
  },
});
