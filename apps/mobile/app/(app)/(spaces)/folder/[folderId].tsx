import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalFolderNode, LocalNode } from '@colanode/client/types/nodes';
import { hasNodeRole } from '@colanode/core';
import { NodeActionSheet } from '@colanode/mobile/components/nodes/node-action-sheet';
import { NodeChildList } from '@colanode/mobile/components/nodes/node-child-list';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useFolderFileUpload } from '@colanode/mobile/hooks/use-folder-file-upload';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { useNodeRole } from '@colanode/mobile/hooks/use-node-role';
import { navigateToNode } from '@colanode/mobile/lib/navigation-utils';
import { getNodeDisplayName } from '@colanode/mobile/lib/node-utils';

export default function FolderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const { userId } = useWorkspace();
  const { colors } = useTheme();
  const [showRename, setShowRename] = useState(false);
  const [actionNode, setActionNode] = useState<LocalNode | null>(null);
  const { pickAndUploadFile } = useFolderFileUpload({ parentId: folderId!, userId });

  const { data: folder } = useNodeQuery<LocalFolderNode>(userId, folderId, 'folder');

  const { data: children, isLoading, refetch, isRefetching } = useNodeListQuery(
    userId,
    [{ field: ['parentId'], operator: 'eq', value: folderId }],
    [{ field: ['createdAt'], direction: 'asc', nulls: 'last' }]
  );

  const nodeRole = useNodeRole(userId, folder?.rootId);
  const canDelete = nodeRole !== null && hasNodeRole(nodeRole, 'admin');
  const canRename = nodeRole !== null && hasNodeRole(nodeRole, 'editor');
  const canUploadFiles = canRename;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <BackButton onPress={() => router.back()} />
        {canRename ? (
          <Pressable
            onPress={() => folder && setShowRename(true)}
            style={styles.headerTitleContainer}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {folder?.name ?? 'Folder'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {folder?.name ?? 'Folder'}
            </Text>
          </View>
        )}
        {canUploadFiles ? (
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={pickAndUploadFile}
          >
            <Feather name="upload" size={16} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      <NodeChildList
        children={(children as LocalNode[] | undefined) ?? []}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        onOpenChild={(node) => navigateToNode(router, node)}
        onLongPressChild={canDelete ? (node) => setActionNode(node) : undefined}
        emptyTitle="Empty folder"
        emptySubtitle={
          canUploadFiles
            ? 'Tap upload to add content'
            : 'Nothing has been added to this folder yet'
        }
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 32,
  },
});
