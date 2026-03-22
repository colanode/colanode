import '@colanode/ui/styles/editor.css';

import {
  EditorContent,
  type FocusPosition,
  type JSONContent,
  useEditor,
} from '@tiptap/react';
import { debounce, isEqual } from 'lodash-es';
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
import { type RichTextContent, richTextContentSchema } from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  BlockquoteNode,
  BoldMark,
  BulletListNode,
  CodeBlockNode,
  CodeMark,
  ColorMark,
  CommanderExtension,
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
  TableHeaderNode,
  TableCellNode,
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
import {
  BlockquoteCommand,
  BulletListCommand,
  CodeBlockCommand,
  DividerCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  OrderedListCommand,
  ParagraphCommand,
  TableCommand,
  TodoCommand,
} from '@colanode/ui/editor/commands';
import { isSlashCommandActive } from '@colanode/ui/editor/extensions/commander';
import { MobilePageNode } from './extensions/page';
import { MobileFolderNode } from './extensions/folder';
import { MobileFileNode } from './extensions/file';
import { MobileDatabaseNode } from './extensions/database';
import { postEditorFocus } from './bridge';

interface DocumentEditorProps {
  node: LocalNode;
  state: DocumentState | null | undefined;
  updates: DocumentUpdate[];
  canEdit: boolean;
  autoFocus?: FocusPosition;
}

const buildYDoc = (
  state: DocumentState | null | undefined,
  updates: DocumentUpdate[]
) => {
  const ydoc = new YDoc(state?.state);
  for (const update of updates) {
    ydoc.applyUpdate(update.data);
  }
  return ydoc;
};

export const DocumentEditor = ({
  node,
  state,
  updates,
  canEdit,
  autoFocus,
}: DocumentEditorProps) => {
  const workspace = useWorkspace();

  const hasPendingChanges = useRef(false);
  const revisionRef = useRef(state?.revision ?? 0);
  const ydocRef = useRef<YDoc>(buildYDoc(state, updates));
  const pendingRemoteRef = useRef<{
    state: DocumentState;
    updates: DocumentUpdate[];
  } | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
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
          for (const [key, value] of Object.entries(beforeBlocks)) {
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
          await window.colanode.executeMutation({
            type: 'document.update',
            userId: workspace.userId,
            documentId: node.id,
            update: encodeState(update),
          });
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
      extensions: [
        IdExtension,
        ParserExtension,
        Markdown,
        DocumentNode,
        MobilePageNode,
        MobileFolderNode,
        MobileFileNode,
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
        MobileDatabaseNode,
        AutoJoiner,
        CommanderExtension.configure({
          commands: [
            ParagraphCommand,
            BlockquoteCommand,
            Heading1Command,
            Heading2Command,
            Heading3Command,
            BulletListCommand,
            CodeBlockCommand,
            OrderedListCommand,
            TableCommand,
            DividerCommand,
            TodoCommand,
          ],
          context: {
            userId: workspace.userId,
            documentId: node.id,
            accountId: workspace.accountId,
            workspaceId: workspace.workspaceId,
            rootId: node.rootId,
          },
        }),
        BoldMark,
        ItalicMark,
        UnderlineMark,
        StrikethroughMark,
        CodeMark,
        ColorMark,
        HighlightMark,
      ],
      editorProps: {
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full text-foreground',
          spellCheck: 'true',
        },
        handleDOMEvents: {
          mousedown: (_view, event) => {
            if (isSlashCommandActive()) {
              event.preventDefault();
              return true;
            }
            return false;
          },
        },
      },
      content: buildEditorContent(
        node.id,
        ydocRef.current.getObject<RichTextContent>()
      ),
      editable: canEdit,
      shouldRerenderOnTransaction: false,
      autofocus: autoFocus,
      onUpdate: async ({ editor, transaction }) => {
        if (transaction.docChanged) {
          hasPendingChanges.current = true;
          debouncedSave(editor.getJSON());
        }
      },
      onFocus: () => postEditorFocus(true),
      onBlur: () => postEditorFocus(false),
    },
    [node.id]
  );

  // Keep editorRef in sync for use in debouncedSave replay
  editorRef.current = editor;

  // Reconciliation: apply remote state updates to editor
  // Uses a ref to track whether we have local pending changes
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

  // Expose flush for the bridge so pending saves are not lost
  useEffect(() => {
    (window as unknown as { __editorFlush?: () => void }).__editorFlush =
      () => {
        if (hasPendingChanges.current && editor) {
          debouncedSave.flush();
        }
      };
    return () => {
      delete (window as unknown as { __editorFlush?: () => void })
        .__editorFlush;
    };
  }, [debouncedSave, editor]);

  // Expose editor instance for bridge commands (blur, block commands)
  useEffect(() => {
    (window as unknown as { __editorInstance?: typeof editor }).__editorInstance = editor;
    return () => {
      delete (window as unknown as { __editorInstance?: typeof editor }).__editorInstance;
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
};
