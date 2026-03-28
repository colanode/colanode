import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalSpaceNode } from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import { extractNodeRole, hasNodeRole, NodeRole } from '@colanode/core';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { SpaceAddCollaboratorSheet } from '@colanode/mobile/components/spaces/space-add-collaborator-sheet';
import { SpaceCollaboratorRoleSheet } from '@colanode/mobile/components/spaces/space-collaborator-role-sheet';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';

const ROLE_LABELS: Record<NodeRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  collaborator: 'Collaborator',
  viewer: 'Viewer',
};

interface CollaboratorEntry {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: NodeRole;
}

export default function SpaceSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const { userId } = useWorkspace();
  const { colors } = useTheme();
  const { mutate } = useMutation();
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<CollaboratorEntry | null>(null);

  const { data: space } = useNodeQuery<LocalSpaceNode>(userId, spaceId, 'space');
  const { data: users } = useLiveQuery({ type: 'user.list', userId });

  const nodeRole = space ? extractNodeRole(space, userId) : null;
  const isAdmin = nodeRole !== null && hasNodeRole(nodeRole, 'admin');

  const collaborators = useMemo(() => {
    if (!space?.collaborators || !users) return [];

    const userMap = new Map<string, User>();
    for (const user of users) {
      userMap.set(user.id, user);
    }

    const entries: CollaboratorEntry[] = [];
    for (const [collaboratorId, role] of Object.entries(space.collaborators)) {
      const user = userMap.get(collaboratorId);
      if (user) {
        entries.push({
          id: collaboratorId,
          name: user.customName ?? user.name,
          email: user.email,
          avatar: user.avatar,
          role: role as NodeRole,
        });
      }
    }

    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }, [space?.collaborators, users]);

  const existingCollaboratorIds = useMemo(
    () => collaborators.map((c) => c.id),
    [collaborators]
  );

  const adminCount = useMemo(
    () => collaborators.filter((c) => c.role === 'admin').length,
    [collaborators]
  );

  const getCanEdit = (collaborator: CollaboratorEntry) => {
    if (!isAdmin) return false;
    if (collaborator.role === 'admin' && adminCount <= 1) return false;
    return true;
  };

  const getCanRemove = (collaborator: CollaboratorEntry) => {
    if (!isAdmin) return false;
    if (collaborator.role === 'admin' && adminCount <= 1) return false;
    return true;
  };

  const handleDeleteSpace = () => {
    if (!space || !isAdmin) return;

    Alert.alert(
      'Delete space',
      `Are you sure you want to delete "${space.name}"? This will permanently delete the space and all its contents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            mutate({
              input: {
                type: 'node.delete',
                userId,
                nodeId: space.id,
              },
              onSuccess() {
                router.replace('/(app)/(spaces)');
              },
              onError(error) {
                Alert.alert('Error', error.message);
              },
            });
          },
        },
      ]
    );
  };

  if (!space) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}
        >
          <BackButton onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Space Settings
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Space Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
              Collaborators ({collaborators.length})
            </Text>
            {isAdmin && (
              <Pressable
                onPress={() => setShowAddCollaborator(true)}
                style={styles.addButton}
              >
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Add
                </Text>
              </Pressable>
            )}
          </View>

          {collaborators.map((collaborator) => (
            <Pressable
              key={collaborator.id}
              style={({ pressed }) => [
                styles.collaboratorRow,
                pressed &&
                  isAdmin && { backgroundColor: colors.surface },
              ]}
              disabled={!isAdmin}
              onPress={() => setSelectedCollaborator(collaborator)}
            >
              <UserAvatar
                name={collaborator.name}
                avatar={collaborator.avatar}
                size={40}
              />
              <View style={styles.collaboratorInfo}>
                <Text
                  style={[styles.collaboratorName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {collaborator.name}
                  {collaborator.id === userId && (
                    <Text style={{ color: colors.textMuted }}> (you)</Text>
                  )}
                </Text>
                <Text
                  style={[
                    styles.collaboratorEmail,
                    { color: colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {collaborator.email}
                </Text>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: colors.surfaceHover },
                ]}
              >
                <Text
                  style={[styles.roleText, { color: colors.textSecondary }]}
                >
                  {ROLE_LABELS[collaborator.role]}
                </Text>
                {isAdmin && (
                  <Feather
                    name="chevron-down"
                    size={14}
                    color={colors.textMuted}
                  />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
                Danger zone
              </Text>
            </View>
            <Text style={[styles.dangerDescription, { color: colors.textMuted }]}>
              Once you delete a space, there is no going back. All content
              within this space will be permanently removed.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                { borderColor: colors.error },
                pressed && { backgroundColor: colors.error, opacity: 0.1 },
              ]}
              onPress={handleDeleteSpace}
            >
              <Feather name="trash-2" size={18} color={colors.error} />
              <Text style={[styles.deleteText, { color: colors.error }]}>
                Delete space
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <SpaceAddCollaboratorSheet
        visible={showAddCollaborator}
        onClose={() => setShowAddCollaborator(false)}
        spaceId={spaceId!}
        userId={userId}
        existingCollaboratorIds={existingCollaboratorIds}
      />

      <SpaceCollaboratorRoleSheet
        visible={selectedCollaborator !== null}
        onClose={() => setSelectedCollaborator(null)}
        spaceId={spaceId!}
        userId={userId}
        collaborator={
          selectedCollaborator
            ? {
                id: selectedCollaborator.id,
                name: selectedCollaborator.name,
                currentRole: selectedCollaborator.role,
              }
            : null
        }
        canEdit={
          selectedCollaborator ? getCanEdit(selectedCollaborator) : false
        }
        canRemove={
          selectedCollaborator ? getCanRemove(selectedCollaborator) : false
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
  content: {
    paddingBottom: 40,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    paddingVertical: 2,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  collaboratorInfo: {
    flex: 1,
    gap: 2,
  },
  collaboratorName: {
    fontSize: 15,
    fontWeight: '500',
  },
  collaboratorEmail: {
    fontSize: 13,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dangerDescription: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
