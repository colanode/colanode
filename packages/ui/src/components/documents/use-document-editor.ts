import {
  type EditorOptions,
  type Extensions,
  type FocusPosition,
  type JSONContent,
} from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { debounce, isEqual } from 'lodash-es';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef } from 'react';

import {
  restoreRelativeSelection,
  getRelativeSelection,
  mapContentsToBlocks,
  buildEditorContent,
} from '@colanode/client/lib';
import type {
  LocalNode,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types';
import {
  type Block,
  type RichTextContent,
  richTextContentSchema,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  BlockquoteNode,
  BoldMark,
  BulletListNode,
  CodeBlockNode,
  CodeMark,
  ColorMark,
  DeleteControlExtension,
  DividerNode,
  DocumentNode,
  DropcursorExtension,
  Heading1Node,
  Heading2Node,
  Heading3Node,
  HighlightMark,
  IdExtension,
  ItalicMark,
  LinkMark,
  ListItemNode,
  ListKeymapExtension,
  OrderedListNode,
  ParagraphNode,
  PlaceholderExtension,
  StrikethroughMark,
  TabKeymapExtension,
  TableNode,
  TableRowNode,
  TableCellNode,
  TableHeaderNode,
  TaskItemNode,
  TaskListNode,
  TextNode,
  TrailingNode,
  UnderlineMark,
  AutoJoiner,
  HardBreakNode,
  ParserExtension,
  Markdown,
} from '@colanode/ui/editor/extensions';

interface UseDocumentEditorOptions {
  node: LocalNode;
  state: DocumentState | null | undefined;
  updates: DocumentUpdate[];
  canEdit: boolean;
  autoFocus?: FocusPosition;
  platformExtensions: Extensions;
  editorProps?: EditorOptions['editorProps'];
  onFocus?: () => void;
  onBlur?: () => void;
}

export const buildYDoc = (
  state: DocumentState | null | undefined,
  updates: DocumentUpdate[]
) => {
  const ydoc = new YDoc(state?.state);
  for (const update of updates) {
    ydoc.applyUpdate(update.data);
  }
  return ydoc;
};

const sharedBaseExtensions = [
  IdExtension,
  ParserExtension,
  Markdown,
  DocumentNode,
  TextNode,
  ParagraphNode,
  HardBreakNode,
  Heading1Node,
  Heading2Node,
  Heading3Node,
  BlockquoteNode,
  BulletListNode,
  CodeBlockNode,
  TabKeymapExtension,
  ListItemNode,
  ListKeymapExtension,
  OrderedListNode,
  PlaceholderExtension.configure({
    message: "Write something or '/' for commands",
  }),
  TaskListNode,
  TaskItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  TableHeaderNode,
  DividerNode,
  TrailingNode,
  LinkMark,
  DeleteControlExtension,
  DropcursorExtension,
  AutoJoiner,
  BoldMark,
  ItalicMark,
  UnderlineMark,
  StrikethroughMark,
  CodeMark,
  ColorMark,
  HighlightMark,
];

export const useDocumentEditor = ({
  node,
  state,
  updates,
  canEdit,
  autoFocus,
  platformExtensions,
  editorProps,
  onFocus,
  onBlur,
}: UseDocumentEditorOptions) => {
  const workspace = useWorkspace();

  const hasPendingChanges = useRef(false);
  const revisionRef = useRef(state?.revision ?? 0);
  const ydocRef = useRef<YDoc>(buildYDoc(state, updates));
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const pendingRemoteRef = useRef<{
    state: DocumentState;
    updates: DocumentUpdate[];
  } | null>(null);
  const appliedUpdateIdsRef = useRef<Set<string>>(
    new Set(updates.map((u) => u.id))
  );

  const reconcileRef = useRef(
    (
      ed: NonNullable<ReturnType<typeof useEditor>>,
      remoteState: DocumentState,
      remoteUpdates: DocumentUpdate[],
      nodeId: string
    ) => {
      const beforeContent = ydocRef.current.getObject<RichTextContent>();

      ydocRef.current.applyUpdate(remoteState.state);
      for (const update of remoteUpdates) {
        ydocRef.current.applyUpdate(update.data);
      }

      const afterContent = ydocRef.current.getObject<RichTextContent>();

      revisionRef.current = remoteState.revision;

      if (isEqual(afterContent, beforeContent)) return;

      const editorContent = buildEditorContent(nodeId, afterContent);

      const relativeSelection = getRelativeSelection(ed);
      ed.chain().setContent(editorContent).run();

      if (relativeSelection != null) {
        restoreRelativeSelection(ed, relativeSelection);
      }
    }
  );

  const debouncedSave = useMemo(
    () =>
      debounce(async (content: JSONContent) => {
        const beforeContent = ydocRef.current.getObject<RichTextContent>();
        const beforeBlocks = beforeContent?.blocks;
        const indexMap = new Map<string, string>();
        if (beforeBlocks) {
          for (const [key, value] of Object.entries(
            beforeBlocks as Record<string, Block>
          )) {
            indexMap.set(key, value.index);
          }
        }

        const afterBlocks = mapContentsToBlocks(
          node.id,
          content.content ?? [],
          indexMap
        );

        const afterContent: RichTextContent = {
          type: 'rich_text',
          blocks: afterBlocks,
        };

        const update = ydocRef.current.update(
          richTextContentSchema,
          afterContent
        );

        if (!update) {
          hasPendingChanges.current = false;
          return;
        }

        try {
          const result = await window.colanode.executeMutation({
            type: 'document.update',
            userId: workspace.userId,
            documentId: node.id,
            update: encodeState(update),
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        } finally {
          hasPendingChanges.current = false;

          // Replay stashed remote updates that arrived during local editing
          const stashed = pendingRemoteRef.current;
          if (stashed && editorRef.current) {
            pendingRemoteRef.current = null;
            for (const u of stashed.updates) {
              appliedUpdateIdsRef.current.add(u.id);
            }
            reconcileRef.current(
              editorRef.current,
              stashed.state,
              stashed.updates,
              node.id
            );
          }
        }
      }, 500),
    [node.id, workspace.userId]
  );

  const editor = useEditor(
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extensions: [...sharedBaseExtensions, ...platformExtensions] as any,
      editorProps: {
        ...editorProps,
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full text-foreground',
          spellCheck: 'false',
          ...(editorProps?.attributes as Record<string, string>),
        },
      },
      content: buildEditorContent(
        node.id,
        ydocRef.current.getObject<RichTextContent>()
      ),
      editable: canEdit,
      shouldRerenderOnTransaction: false,
      autofocus: autoFocus,
      onUpdate: async ({ editor: ed, transaction }) => {
        if (transaction.docChanged) {
          hasPendingChanges.current = true;
          debouncedSave(ed.getJSON());
        }
      },
      onFocus,
      onBlur,
    },
    [node.id]
  );

  // Keep editorRef in sync for use in debouncedSave replay
  editorRef.current = editor;

  // Reconciliation: apply remote state updates to editor
  useEffect(() => {
    if (!editor) return;
    if (!state) return;

    const revisionChanged = revisionRef.current !== state.revision;
    const hasNewUpdates = updates.some(
      (u) => !appliedUpdateIdsRef.current.has(u.id)
    );

    if (!revisionChanged && !hasNewUpdates) return;

    // Stash remote updates when local edits are pending — replayed after save
    if (hasPendingChanges.current) {
      pendingRemoteRef.current = { state, updates };
      return;
    }

    for (const u of updates) {
      appliedUpdateIdsRef.current.add(u.id);
    }
    reconcileRef.current(editor, state, updates, node.id);
  }, [state, updates, editor, node.id]);

  return { editor, ydocRef, hasPendingChanges, debouncedSave };
};
