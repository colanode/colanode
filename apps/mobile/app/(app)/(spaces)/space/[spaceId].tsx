import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LocalNode, LocalSpaceNode } from '@colanode/client/types/nodes';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { CreateNodeSheet } from '@colanode/mobile/components/nodes/create-node-sheet';
import { NodeActionSheet } from '@colanode/mobile/components/nodes/node-action-sheet';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { getNodeDisplayName } from '@colanode/mobile/lib/node-utils';

const NODE_TYPE_LABELS: Record<string, string> = {
  channel: 'Channel',
  page: 'Page',
  folder: 'Folder',
  database: 'Database',
  file: 'File',
};

export default function SpaceScreen() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const { userId, role } = useWorkspace();
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

  const handleOpenChild = (node: LocalNode) => {
    switch (node.type) {
      case 'channel':
        router.push({
          pathname: '/(app)/(spaces)/channel/[channelId]',
          params: { channelId: node.id },
        });
        break;
      case 'page':
        router.push({
          pathname: '/(app)/(spaces)/page/[pageId]',
          params: { pageId: node.id },
        });
        break;
      case 'folder':
        router.push({
          pathname: '/(app)/(spaces)/folder/[folderId]',
          params: { folderId: node.id },
        });
        break;
      case 'file':
        router.push({
          pathname: '/(app)/(spaces)/file/[fileId]',
          params: { fileId: node.id },
        });
        break;
    }
  };

  const canDelete = role === 'owner' || role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton onPress={() => router.back()} />
        <Pressable
          onPress={() => space && setShowRename(true)}
          style={styles.headerTitleContainer}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {space?.name ?? 'Space'}
          </Text>
        </Pressable>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={children ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.childRow,
              pressed && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleOpenChild(item)}
            onLongPress={canDelete ? () => setActionNode(item) : undefined}
            delayLongPress={500}
          >
            <View style={styles.iconContainer}>
              <NodeIcon type={item.type} size={20} />
            </View>
            <View style={styles.childInfo}>
              <Text style={[styles.childName, { color: colors.text }]} numberOfLines={1}>
                {getNodeDisplayName(item)}
              </Text>
              <Text style={[styles.childType, { color: colors.textMuted }]}>
                {NODE_TYPE_LABELS[item.type] ?? item.type}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.sheetHandle} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.listSeparator }]} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Empty space"
              subtitle="Tap the button below to add content"
            />
          ) : null
        }
      />
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
    paddingTop: 56,
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
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  list: {
    flexGrow: 1,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    gap: 2,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
  },
  childType: {
    fontSize: 12,
  },
});
