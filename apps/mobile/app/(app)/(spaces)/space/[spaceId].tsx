import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LocalNode, LocalSpaceNode } from '@colanode/client/types/nodes';
import { CreateNodeSheet } from '@colanode/mobile/components/nodes/create-node-sheet';
import { NodeActionSheet } from '@colanode/mobile/components/nodes/node-action-sheet';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

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

  const { data: spaceNodes } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: spaceId },
      { field: ['type'], operator: 'eq', value: 'space' },
    ],
    [],
    1
  );

  const space = spaceNodes?.[0] as LocalSpaceNode | undefined;

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

  const getNodeName = (node: LocalNode): string => {
    return 'name' in node ? (node as any).name ?? node.type : node.type;
  };

  const canDelete = role === 'owner' || role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{'\u2039'} Back</Text>
        </Pressable>
        <Pressable
          onPress={() => space && setShowRename(true)}
          style={styles.headerTitleContainer}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {space?.name ?? 'Space'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <Text style={[styles.addButtonText, { color: colors.text }]}>+</Text>
        </Pressable>
      </View>
      <FlatList
        data={(children as LocalNode[] | undefined) ?? []}
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
                {getNodeName(item)}
              </Text>
              <Text style={[styles.childType, { color: colors.textMuted }]}>
                {NODE_TYPE_LABELS[item.type] ?? item.type}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.sheetHandle} />
          </Pressable>
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
              subtitle="Tap + to add content"
            />
          ) : null
        }
      />
      <CreateNodeSheet
        visible={showCreate}
        parentId={spaceId!}
        userId={userId}
        onClose={() => setShowCreate(false)}
      />
      <NodeActionSheet
        visible={actionNode !== null}
        nodeId={actionNode?.id ?? null}
        nodeName={actionNode ? getNodeName(actionNode) : ''}
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
  backText: {
    fontSize: 16,
    width: 60,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '400',
    marginTop: -1,
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
