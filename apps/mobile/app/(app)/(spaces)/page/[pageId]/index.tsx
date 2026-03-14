import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Block,
  RichTextContent,
  richTextContentSchema,
} from '@colanode/core';
import { mapBlocksToContents } from '@colanode/client/lib';
import { LocalPageNode } from '@colanode/client/types/nodes';
import { encodeState, YDoc } from '@colanode/crdt';

import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { BlockRenderer } from '@colanode/mobile/components/messages/block-renderer';
import { RenameNodeSheet } from '@colanode/mobile/components/nodes/rename-node-sheet';
import { PageTitleInput } from '@colanode/mobile/components/pages/page-title-input';
import { PageBlockRow, BlockRowRef } from '@colanode/mobile/components/pages/page-block-row';
import { PageBlockTypeSheet } from '@colanode/mobile/components/pages/page-block-type-sheet';
import { PageEditorToolbar } from '@colanode/mobile/components/pages/page-editor-toolbar';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { useNodeRole } from '@colanode/mobile/hooks/use-node-role';
import {
  EditableBlock,
  blocksToEditModel,
  editModelToBlocks,
  createEmptyBlock,
  getNextBlockType,
} from '@colanode/mobile/lib/page-editor';

// --- Read-only page view ---
const ReadOnlyPageView = ({
  page,
  pageId,
  userId,
}: {
  page: LocalPageNode | undefined;
  pageId: string;
  userId: string;
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: document, isLoading, refetch, isRefetching } = useLiveQuery({
    type: 'document.get',
    documentId: pageId,
    userId,
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  let jsonContent = null;
  if (document?.content) {
    const richText = document.content as RichTextContent;
    if (richText.blocks) {
      const blocks = Object.values(richText.blocks) as Block[];
      const contents = mapBlocksToContents(pageId, blocks);
      if (contents.length > 0) {
        jsonContent = { type: 'doc' as const, content: contents };
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {page?.name ?? 'Page'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.textMuted} />
        }
      >
        {jsonContent ? (
          <BlockRenderer content={jsonContent} />
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>This page is empty</Text>
        )}
      </ScrollView>
    </View>
  );
};

// --- Editable page view ---
const EditablePageView = ({
  page,
  pageId,
  userId,
}: {
  page: LocalPageNode;
  pageId: string;
  userId: string;
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { appService } = useAppService();
  const insets = useSafeAreaInsets();

  const { data: docState, isLoading: stateLoading } = useLiveQuery({
    type: 'document.state.get',
    documentId: pageId,
    userId,
  });

  const { data: docUpdates, isLoading: updatesLoading } = useLiveQuery({
    type: 'document.updates.list',
    documentId: pageId,
    userId,
  });

  // Initialize CRDT state once data is loaded
  const [initialData] = useState(() => {
    const ydoc = new YDoc(docState?.state);
    if (docUpdates) {
      for (const update of docUpdates) {
        ydoc.applyUpdate(update.data);
      }
    }
    const content = ydoc.getObject<RichTextContent>();
    return { ydoc, content };
  });

  const ydocRef = useRef<YDoc>(initialData.ydoc);

  const [title, setTitle] = useState(page.name ?? '');
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => {
    const allBlocks = initialData.content?.blocks
      ? Object.values(initialData.content.blocks)
      : [];
    return blocksToEditModel(pageId, allBlocks);
  });
  const [typeSheetIndex, setTypeSheetIndex] = useState<number | null>(null);
  const focusedBlockIndexRef = useRef<number | null>(null);

  const titleDirtyRef = useRef(false);
  const docDirtyRef = useRef(false);
  const revisionRef = useRef(docState?.revision ?? '0');
  const blockRefs = useRef<Map<string, BlockRowRef>>(new Map());
  const originalBlocksRef = useRef<Record<string, Block>>(
    initialData.content?.blocks ?? {}
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const titleRef = useRef(title);
  titleRef.current = title;

  const buildIndexMap = useCallback((): Map<string, string> => {
    const ydoc = ydocRef.current;
    const content = ydoc.getObject<RichTextContent>();
    const map = new Map<string, string>();
    if (content?.blocks) {
      for (const [key, value] of Object.entries(content.blocks)) {
        map.set(key, value.index);
      }
    }
    return map;
  }, []);

  const flushDocumentSave = useCallback(() => {
    if (!docDirtyRef.current) return;

    const ydoc = ydocRef.current;
    const indexMap = buildIndexMap();
    const afterBlocks = editModelToBlocks(
      pageId,
      blocksRef.current,
      originalBlocksRef.current,
      indexMap
    );

    const afterContent: RichTextContent = {
      type: 'rich_text',
      blocks: afterBlocks,
    };

    try {
      const update = ydoc.update(richTextContentSchema, afterContent);
      docDirtyRef.current = false;

      if (update) {
        appService.mediator.executeMutation({
          type: 'document.update',
          userId,
          documentId: pageId,
          update: encodeState(update),
        });
      }
    } catch (err) {
      console.warn('Failed to save document:', err);
    }
  }, [pageId, userId, appService, buildIndexMap]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushDocumentSave();
    }, 500);
  }, [flushDocumentSave]);

  const cancelSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const flushTitleSave = useCallback(() => {
    if (!titleDirtyRef.current) return;
    titleDirtyRef.current = false;

    appService.mediator.executeMutation({
      type: 'node.update',
      userId,
      nodeId: pageId,
      attributes: {
        type: 'page',
        name: titleRef.current.trim() || 'Untitled',
        avatar: page.avatar,
        parentId: page.parentId!,
      },
    });
  }, [page, pageId, userId, appService]);

  // Flush on app background
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        cancelSave();
        flushDocumentSave();
        flushTitleSave();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      cancelSave();
    };
  }, [cancelSave, flushDocumentSave, flushTitleSave]);

  // Flush on navigation away
  useEffect(() => {
    return () => {
      cancelSave();
      // Use refs to flush latest state on unmount
      if (docDirtyRef.current) {
        flushDocumentSave();
      }
      if (titleDirtyRef.current) {
        flushTitleSave();
      }
    };
  }, [cancelSave, flushDocumentSave, flushTitleSave]);

  // Reconcile remote updates
  useEffect(() => {
    if (!docState) return;
    if (docDirtyRef.current) return;
    if (revisionRef.current === docState.revision) return;

    const ydoc = ydocRef.current;
    ydoc.applyUpdate(docState.state);
    if (docUpdates) {
      for (const u of docUpdates) {
        ydoc.applyUpdate(u.data);
      }
    }

    revisionRef.current = docState.revision;
    const content = ydoc.getObject<RichTextContent>();
    const allBlocks = content?.blocks ? Object.values(content.blocks) : [];
    originalBlocksRef.current = content?.blocks ?? {};
    setBlocks(blocksToEditModel(pageId, allBlocks));
  }, [docState, docUpdates, pageId]);

  // Sync title from node updates
  useEffect(() => {
    if (!titleDirtyRef.current && page.name !== titleRef.current) {
      setTitle(page.name ?? '');
    }
  }, [page.name]);

  const handleBlockChange = (index: number, text: string) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, text };
      return next;
    });
    docDirtyRef.current = true;
    scheduleSave();
  };

  const handleBlockSubmit = (index: number) => {
    const currentBlock = blocks[index];
    if (!currentBlock) return;

    const nextType = getNextBlockType(currentBlock.type);
    const newBlock = createEmptyBlock(nextType);

    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
    docDirtyRef.current = true;
    scheduleSave();

    setTimeout(() => {
      blockRefs.current.get(newBlock.id)?.focus();
    }, 50);
  };

  const handleBackspaceEmpty = (index: number) => {
    const block = blocks[index];
    if (!block || !block.editable) return;

    if (block.type !== 'paragraph') {
      setBlocks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index]!, type: 'paragraph', checked: undefined, attrs: undefined };
        return next;
      });
      docDirtyRef.current = true;
      scheduleSave();
      return;
    }

    if (blocks.length <= 1) return;

    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    docDirtyRef.current = true;
    scheduleSave();

    const prevEditable = blocks.slice(0, index).reverse().find((b) => b.editable);
    if (prevEditable) {
      setTimeout(() => blockRefs.current.get(prevEditable.id)?.focus(), 50);
    }
  };

  const handleToggleCheck = (index: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, checked: !next[index]!.checked };
      return next;
    });
    docDirtyRef.current = true;
    scheduleSave();
  };

  const handleBlockTypeChange = (type: string) => {
    if (typeSheetIndex === null) return;
    setBlocks((prev) => {
      const next = [...prev];
      const block = next[typeSheetIndex];
      if (!block) return prev;
      next[typeSheetIndex] = {
        ...block,
        type,
        checked: type === 'taskItem' ? block.checked ?? false : undefined,
        attrs: type === 'horizontalRule' ? undefined : block.attrs,
      };
      return next;
    });
    docDirtyRef.current = true;
    scheduleSave();
  };

  if (stateLoading || updatesLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {title || 'Page'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <PageTitleInput
            value={title}
            onChangeText={(text) => { setTitle(text); titleDirtyRef.current = true; }}
            onBlur={() => flushTitleSave()}
          />
          {blocks.map((block, index) => (
            <PageBlockRow
              key={block.id}
              ref={(r) => {
                if (r) blockRefs.current.set(block.id, r);
                else blockRefs.current.delete(block.id);
              }}
              block={block}
              originalBlocks={originalBlocksRef.current}
              onChangeText={(text) => handleBlockChange(index, text)}
              onSubmit={() => handleBlockSubmit(index)}
              onBackspaceEmpty={() => handleBackspaceEmpty(index)}
              onToggleCheck={() => handleToggleCheck(index)}
              onLongPress={() => block.editable && setTypeSheetIndex(index)}
              onFocus={() => { focusedBlockIndexRef.current = index; }}
            />
          ))}
        </ScrollView>
        <PageEditorToolbar
          onAddBlock={() => {
            const idx = focusedBlockIndexRef.current;
            if (idx !== null && blocks[idx]?.editable) {
              setTypeSheetIndex(idx);
            }
          }}
        />
      </KeyboardAvoidingView>
      <PageBlockTypeSheet
        visible={typeSheetIndex !== null}
        currentType={typeSheetIndex !== null ? (blocks[typeSheetIndex]?.type ?? 'paragraph') : 'paragraph'}
        onSelect={handleBlockTypeChange}
        onClose={() => setTypeSheetIndex(null)}
      />
    </View>
  );
};

// --- Main page screen ---
export default function PageScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { userId } = useWorkspace();

  const { data: page, isLoading: pageLoading } = useNodeQuery<LocalPageNode>(userId, pageId, 'page');
  const { canEdit, isLoading: roleLoading } = useNodeRole(userId, page);

  if (pageLoading || roleLoading) {
    return <LoadingScreen />;
  }

  if (canEdit && page) {
    return <EditablePageView key={pageId} page={page} pageId={pageId!} userId={userId} />;
  }

  return <ReadOnlyPageView page={page} pageId={pageId!} userId={userId} />;
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
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
