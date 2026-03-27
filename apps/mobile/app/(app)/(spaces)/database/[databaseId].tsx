import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalDatabaseNode } from '@colanode/client/types/nodes';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import {
  PageWebView,
  type PageWebViewHandle,
} from '@colanode/mobile/components/pages/page-webview';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { SkeletonPage } from '@colanode/mobile/components/ui/skeleton';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { useNodeRole } from '@colanode/mobile/hooks/use-node-role';
import { navigateToNodeByType } from '@colanode/mobile/lib/navigation-utils';

export default function DatabaseScreen() {
  const { databaseId } = useLocalSearchParams<{ databaseId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, accountId, workspaceId, role } = useWorkspace();
  const { colors } = useTheme();
  const [showRename, setShowRename] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const webViewRef = useRef<PageWebViewHandle>(null);

  const { data: database, isLoading: databaseLoading } =
    useNodeQuery<LocalDatabaseNode>(userId, databaseId, 'database');
  const { canEdit, isLoading: roleLoading } = useNodeRole(userId, database);

  const handleNavigateNode = useCallback(
    (nodeId: string, nodeType: string) => {
      navigateToNodeByType(router, nodeId, nodeType as never);
    },
    [router]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) =>
      setKeyboardHeight(event.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (databaseLoading || roleLoading) {
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
        {canEdit && database ? (
          <Pressable
            onPress={() => setShowRename(true)}
            style={styles.headerTitleContainer}
          >
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {database.name || 'Database'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {database?.name ?? 'Database'}
            </Text>
          </View>
        )}
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <PageWebView
          ref={webViewRef}
          mode="database"
          nodeId={databaseId!}
          userId={userId}
          accountId={accountId}
          workspaceId={workspaceId}
          workspaceRole={role}
          rootId={database?.rootId ?? ''}
          canEdit={canEdit}
          title={database?.name ?? ''}
          state={null}
          updates={[]}
          keyboardHeight={keyboardHeight}
          onNavigateNode={handleNavigateNode}
        />
      </View>
      {database && (
        <RenameNodeSheet
          visible={showRename}
          node={database}
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
