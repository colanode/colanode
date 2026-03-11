import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { User } from '@colanode/client/types/users';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  collaborator: 'Collaborator',
  viewer: 'Viewer',
};

export default function MembersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId, role } = useWorkspace();
  const canInvite = role === 'owner' || role === 'admin';

  const { data: users, refetch, isRefetching } = useLiveQuery({
    type: 'user.list',
    userId,
  });

  const renderUser = (user: User) => {
    const displayName = user.name;

    return (
      <View style={styles.userRow}>
        <UserAvatar
          name={displayName}
          avatar={user.avatar}
          size={40}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.surfaceHover }]}>
          <Text style={[styles.roleText, { color: colors.textSecondary }]}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Members</Text>
        {canInvite ? (
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
