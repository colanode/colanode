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
import { MobilePageNode } from './extensions/page';
import { MobileFolderNode } from './extensions/folder';
import { MobileFileNode } from './extensions/file';
import { MobileDatabaseNode } from './extensions/database';

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
    },
    [node.id]
  );

  // Reconciliation: apply remote state updates to editor
  // Uses a ref to track whether we have local pending changes
  useEffect(() => {
    if (!editor) return;
    if (!state) return;

    // Always skip reconciliation if we have pending local changes
    if (hasPendingChanges.current) return;

    if (revisionRef.current === state?.revision) return;

    const beforeContent = ydocRef.current.getObject<RichTextContent>();

    ydocRef.current.applyUpdate(state.state);
    for (const update of updates) {
      ydocRef.current.applyUpdate(update.data);
    }

    const afterContent = ydocRef.current.getObject<RichTextContent>();

    // Update revision even if content is equal
    revisionRef.current = state.revision;

    if (isEqual(afterContent, beforeContent)) return;

    const editorContent = buildEditorContent(node.id, afterContent);

    const relativeSelection = getRelativeSelection(editor);
    editor.chain().setContent(editorContent).run();

    if (relativeSelection != null) {
      restoreRelativeSelection(editor, relativeSelection);
    }
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

  return <EditorContent editor={editor} />;
};
