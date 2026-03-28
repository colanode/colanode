import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalPageNode } from '@colanode/client/types/nodes';
import { SkeletonPage } from '@colanode/mobile/components/ui/skeleton';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { PageBlockTypeSheet } from '@colanode/mobile/components/pages/page-block-type-sheet';
import { PageEditorToolbar } from '@colanode/mobile/components/pages/page-editor-toolbar';
import {
  PageWebView,
  type PageWebViewHandle,
} from '@colanode/mobile/components/pages/page-webview';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { useNodeRole } from '@colanode/mobile/hooks/use-node-role';
import { navigateToNodeByType } from '@colanode/mobile/lib/navigation-utils';

export default function PageScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const router = useRouter();
  const { userId, accountId, workspaceId, role } = useWorkspace();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<PageWebViewHandle>(null);

  const { data: page, isLoading: pageLoading } =
    useNodeQuery<LocalPageNode>(userId, pageId, 'page');
  const { canEdit, isLoading: roleLoading } = useNodeRole(userId, page);
  const [showRename, setShowRename] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [editorFocused, setEditorFocused] = useState(false);
  const [showBlockTypes, setShowBlockTypes] = useState(false);

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

  // Track keyboard height
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Flush on app background
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        webViewRef.current?.flush();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Flush on unmount
  useEffect(() => {
    return () => {
      webViewRef.current?.flush();
    };
  }, []);

  const handleNavigateNode = useCallback(
    (nodeId: string, nodeType: string) => {
      navigateToNodeByType(router, nodeId, nodeType as never);
    },
    [router]
  );

  const isLoading = pageLoading || roleLoading || stateLoading || updatesLoading;
  const showToolbar = (keyboardHeight > 0 && editorFocused && canEdit) || showBlockTypes;

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
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
      <View style={styles.content}>
        <PageWebView
          ref={webViewRef}
          nodeId={pageId!}
          userId={userId}
          accountId={accountId}
          workspaceId={workspaceId}
          workspaceRole={role}
          rootId={page?.rootId ?? ''}
          canEdit={canEdit}
          title={page?.name ?? ''}
          state={docState}
          updates={docUpdates ?? []}
          keyboardHeight={keyboardHeight}
          onNavigateNode={handleNavigateNode}
          onEditorFocusChange={setEditorFocused}
        />
      </View>
      <PageBlockTypeSheet
        visible={showBlockTypes}
        onClose={() => setShowBlockTypes(false)}
        onSelect={(command) => webViewRef.current?.executeBlockCommand(command)}
      />
      {showToolbar && (
        <PageEditorToolbar
          onPlusPress={() => setShowBlockTypes(!showBlockTypes)}
          onDismiss={() => webViewRef.current?.blur()}
        />
      )}
      {page && (
        <RenameNodeSheet
          visible={showRename}
          node={page}
          userId={userId}
          onClose={() => setShowRename(false)}
        />
      )}
    </KeyboardAvoidingView>
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
