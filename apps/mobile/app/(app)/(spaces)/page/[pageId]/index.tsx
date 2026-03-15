import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalPageNode } from '@colanode/client/types/nodes';

import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import {
  PageWebView,
  flushPageWebView,
} from '@colanode/mobile/components/pages/page-webview';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { useNodeRole } from '@colanode/mobile/hooks/use-node-role';

export default function PageScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const router = useRouter();
  const { userId, accountId, workspaceId } = useWorkspace();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: page, isLoading: pageLoading } =
    useNodeQuery<LocalPageNode>(userId, pageId, 'page');
  const { canEdit, isLoading: roleLoading } = useNodeRole(userId, page);
  const [showRename, setShowRename] = useState(false);

  const { data: docState, isLoading: stateLoading } = useLiveQuery({
    type: 'document.state.get',
    documentId: pageId!,
    userId,
  });

  const { data: docUpdates, isLoading: updatesLoading } = useLiveQuery({
    type: 'document.updates.list',
    documentId: pageId!,
    userId,
  });

  // Flush on app background
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flushPageWebView();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushPageWebView();
    };
  }, []);

  const handleNavigateNode = useCallback(
    (nodeId: string, nodeType: string) => {
      switch (nodeType) {
        case 'page':
          router.push({
            pathname: '/(app)/(spaces)/page/[pageId]',
            params: { pageId: nodeId },
          });
          break;
        case 'folder':
          router.push({
            pathname: '/(app)/(spaces)/folder/[folderId]',
            params: { folderId: nodeId },
          });
          break;
        case 'file':
          router.push({
            pathname: '/(app)/(spaces)/file/[fileId]',
            params: { fileId: nodeId },
          });
          break;
        case 'channel':
          router.push({
            pathname: '/(app)/(spaces)/channel/[channelId]',
            params: { channelId: nodeId },
          });
          break;
        case 'database':
          // Databases don't have a dedicated mobile screen yet
          break;
      }
    },
    [router]
  );

  const isLoading = pageLoading || roleLoading || stateLoading || updatesLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, paddingTop: insets.top + 8 },
        ]}
      >
        <BackButton onPress={() => router.back()} />
        {canEdit && page ? (
          <Pressable
            onPress={() => setShowRename(true)}
            style={styles.headerTitleContainer}
          >
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {page.name || 'Page'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {page?.name ?? 'Page'}
            </Text>
          </View>
        )}
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <PageWebView
          nodeId={pageId!}
          userId={userId}
          accountId={accountId}
          workspaceId={workspaceId}
          rootId={page?.rootId ?? ''}
          canEdit={canEdit}
          title={page?.name ?? ''}
          state={docState}
          updates={docUpdates ?? []}
          onNavigateNode={handleNavigateNode}
        />
      </KeyboardAvoidingView>
      {page && (
        <RenameNodeSheet
          visible={showRename}
          node={page}
          userId={userId}
          onClose={() => setShowRename(false)}
        />
      )}
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
  content: {
    flex: 1,
  },
});
