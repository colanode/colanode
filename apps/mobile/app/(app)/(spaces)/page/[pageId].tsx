import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Block } from '@colanode/core';
import { mapBlocksToContents } from '@colanode/client/lib';
import { LocalPageNode } from '@colanode/client/types/nodes';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { BlockRenderer } from '@colanode/mobile/components/messages/block-renderer';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export default function PageScreen() {
  const router = useRouter();
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { userId } = useWorkspace();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showRename, setShowRename] = useState(false);

  const { data: pageNodes } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: pageId },
      { field: ['type'], operator: 'eq', value: 'page' },
    ],
    [],
    1
  );

  const page = pageNodes?.[0] as LocalPageNode | undefined;

  const { data: document, isLoading, refetch, isRefetching } = useLiveQuery({
    type: 'document.get',
    documentId: pageId!,
    userId,
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  let jsonContent = null;
  if (document?.content) {
    const richText = document.content as any;
    if (richText.blocks) {
      const blocks = Object.values(richText.blocks) as Block[];
      const contents = mapBlocksToContents(pageId!, blocks);
      if (contents.length > 0) {
        jsonContent = { type: 'doc' as const, content: contents };
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <Pressable
          onPress={() => page && setShowRename(true)}
          style={styles.headerTitleContainer}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {page?.name ?? 'Page'}
          </Text>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textMuted}
          />
        }
      >
        {jsonContent ? (
          <BlockRenderer content={jsonContent} />
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>This page is empty</Text>
        )}
      </ScrollView>
      <RenameNodeSheet
        visible={showRename}
        node={page ?? null}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
