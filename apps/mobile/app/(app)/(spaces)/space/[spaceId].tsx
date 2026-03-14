import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalNode, LocalSpaceNode } from '@colanode/client/types/nodes';
import { extractNodeRole, hasNodeRole } from '@colanode/core';
import { CreateNodeSheet } from '@colanode/mobile/components/nodes/create-node-sheet';
import { NodeActionSheet } from '@colanode/mobile/components/nodes/node-action-sheet';
import { NodeChildList } from '@colanode/mobile/components/nodes/node-child-list';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { navigateToNode } from '@colanode/mobile/lib/navigation-utils';
import { getNodeDisplayName } from '@colanode/mobile/lib/node-utils';

export default function SpaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const { userId } = useWorkspace();
  const { colors } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [actionNode, setActionNode] = useState<LocalNode | null>(null);

  const { data: space } = useNodeQuery<LocalSpaceNode>(userId, spaceId, 'space');

  const { data: children, isLoading, refetch, isRefetching } = useNodeListQuery(
    userId,
    [{ field: ['parentId'], operator: 'eq', value: spaceId }],
    [{ field: ['createdAt'], direction: 'asc', nulls: 'last' }]
  );

  const nodeRole = space ? extractNodeRole(space, userId) : null;
  const canDelete = nodeRole !== null && hasNodeRole(nodeRole, 'admin');
  const canRename = canDelete;
  const canCreateChildren = nodeRole !== null && hasNodeRole(nodeRole, 'editor');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <BackButton onPress={() => router.back()} />
        {canRename ? (
          <Pressable
            onPress={() => space && setShowRename(true)}
            style={styles.headerTitleContainer}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {space?.name ?? 'Space'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {space?.name ?? 'Space'}
            </Text>
          </View>
        )}
        <View style={styles.headerSpacer} />
      </View>
      <NodeChildList
        children={(children as LocalNode[] | undefined) ?? []}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        onOpenChild={(node) => navigateToNode(router, node)}
        onLongPressChild={canDelete ? (node) => setActionNode(node) : undefined}
        emptyTitle="Empty space"
        emptySubtitle={
          canCreateChildren
            ? 'Tap the button below to add content'
            : 'Nothing has been added to this space yet'
        }
      />
      {canCreateChildren && (
        <>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.surface },
              pressed && styles.fabPressed,
            ]}
            onPress={() => setShowCreate(true)}
          >
            <Feather name="plus" size={22} color={colors.text} />
          </Pressable>
          <CreateNodeSheet
            visible={showCreate}
            parentId={spaceId!}
            userId={userId}
            onClose={() => setShowCreate(false)}
          />
        </>
      )}
      <NodeActionSheet
        visible={actionNode !== null}
        nodeId={actionNode?.id ?? null}
        nodeName={actionNode ? getNodeDisplayName(actionNode) : ''}
        userId={userId}
        onClose={() => setActionNode(null)}
      />
      <RenameNodeSheet
        visible={showRename}
        node={space ?? null}
        userId={userId}
        onClose={() => setShowRename(false)}
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.8,
  },
});
