import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LocalFolderNode, LocalNode } from '@colanode/client/types/nodes';
import { useFolderFileUpload } from '@colanode/mobile/components/nodes/folder-add-sheet';
import { NodeActionSheet } from '@colanode/mobile/components/nodes/node-action-sheet';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

const NODE_TYPE_LABELS: Record<string, string> = {
  page: 'Page',
  folder: 'Folder',
  file: 'File',
  database: 'Database',
  channel: 'Channel',
};

export default function FolderScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const { userId, role } = useWorkspace();
  const { colors } = useTheme();
  const [showRename, setShowRename] = useState(false);
  const [actionNode, setActionNode] = useState<LocalNode | null>(null);
  const { pickAndUploadFile } = useFolderFileUpload({ parentId: folderId!, userId });

  const { data: folderNodes } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: folderId },
      { field: ['type'], operator: 'eq', value: 'folder' },
    ],
    [],
    1
  );

  const folder = folderNodes?.[0] as LocalFolderNode | undefined;

  const { data: children, isLoading, refetch, isRefetching } = useNodeListQuery(
    userId,
    [{ field: ['parentId'], operator: 'eq', value: folderId }],
    [{ field: ['createdAt'], direction: 'asc', nulls: 'last' }]
  );

  const handleOpenChild = (node: LocalNode) => {
    switch (node.type) {
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
      case 'channel':
        router.push({
          pathname: '/(app)/(spaces)/channel/[channelId]',
          params: { channelId: node.id },
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
          onPress={() => folder && setShowRename(true)}
          style={styles.headerTitleContainer}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {folder?.name ?? 'Folder'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={pickAndUploadFile}
        >
          <Feather name="upload" size={16} color={colors.text} />
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
              title="Empty folder"
              subtitle="Tap + to add content"
            />
          ) : null
        }
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
        node={folder ?? null}
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
