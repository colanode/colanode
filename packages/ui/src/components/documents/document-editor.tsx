import '@colanode/ui/styles/editor.css';

import {
  EditorContent,
  FocusPosition,
  JSONContent,
  useEditor,
} from '@tiptap/react';
import { debounce, isEqual } from 'lodash-es';
import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import {
  restoreRelativeSelection,
  getRelativeSelection,
  mapContentsToBlocks,
  buildEditorContent,
} from '@colanode/client/lib';
import {
  LocalNode,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types';
import { RichTextContent, richTextContentSchema } from '@colanode/core';
import { YDoc } from '@colanode/crdt';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  BlockquoteCommand,
  BulletListCommand,
  CodeBlockCommand,
  DividerCommand,
  FileCommand,
  FolderCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  OrderedListCommand,
  PageCommand,
  ParagraphCommand,
  TableCommand,
  TodoCommand,
  DatabaseCommand,
  DatabaseInlineCommand,
} from '@colanode/ui/editor/commands';
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
  FileNode,
  FolderNode,
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
  PageNode,
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
  DatabaseNode,
  AutoJoiner,
  HardBreakNode,
} from '@colanode/ui/editor/extensions';
import { ToolbarMenu, ActionMenu } from '@colanode/ui/editor/menus';

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

        hasPendingChanges.current = false;

        if (!update) {
          return;
        }

        const result = await window.colanode.executeMutation({
          type: 'document.update',
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          documentId: node.id,
          update,
        });

        if (!result.success) {
          toast.error(result.error.message);
        }
      }, 500),
    [node.id]
  );

  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        DocumentNode,
        PageNode,
        FolderNode,
        FileNode.configure({
          context: {
            userId: workspace.userId,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            documentId: node.id,
            rootId: node.rootId,
          },
        }),
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
        DatabaseNode,
        AutoJoiner,
        CommanderExtension.configure({
          commands: [
            ParagraphCommand,
            PageCommand,
            BlockquoteCommand,
            Heading1Command,
            Heading2Command,
            Heading3Command,
            BulletListCommand,
            CodeBlockCommand,
            OrderedListCommand,
            TableCommand,
            DatabaseInlineCommand,
            DatabaseCommand,
            DividerCommand,
            TodoCommand,
            FileCommand,
            FolderCommand,
          ],
          context: {
            userId: workspace.userId,
            documentId: node.id,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
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
          spellCheck: 'false',
        },
        handleKeyDown: (_, event) => {
          if (event.key === 'z' && event.metaKey && !event.shiftKey) {
            event.preventDefault();
            undo();
            return true;
          }
          if (event.key === 'z' && event.metaKey && event.shiftKey) {
            event.preventDefault();
            redo();
            return true;
          }
          if (event.key === 'y' && event.metaKey) {
            event.preventDefault();
            redo();
            return true;
          }
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

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (!state) {
      return;
    }

    if (hasPendingChanges.current) {
      return;
    }

    if (revisionRef.current === state?.revision) {
      return;
    }

    const beforeContent = ydocRef.current.getObject<RichTextContent>();

    ydocRef.current.applyUpdate(state.state);
    for (const update of updates) {
      ydocRef.current.applyUpdate(update.data);
    }

    const afterContent = ydocRef.current.getObject<RichTextContent>();

    if (isEqual(afterContent, beforeContent)) {
      return;
    }

    const editorContent = buildEditorContent(node.id, afterContent);
    revisionRef.current = state.revision;

    const relativeSelection = getRelativeSelection(editor);
    editor.chain().setContent(editorContent).run();

    if (relativeSelection != null) {
      restoreRelativeSelection(editor, relativeSelection);
    }
  }, [state, updates, editor]);

  const undo = useCallback(async () => {
    if (!editor) {
      return;
    }

    const beforeContent = ydocRef.current.getObject<RichTextContent>();
    const update = ydocRef.current.undo();

    if (!update) {
      return;
    }

    const afterContent = ydocRef.current.getObject<RichTextContent>();

    if (isEqual(beforeContent, afterContent)) {
      return;
    }

    const editorContent = buildEditorContent(node.id, afterContent);
    editor.chain().setContent(editorContent).run();

    const result = await window.colanode.executeMutation({
      type: 'document.update',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      documentId: node.id,
      update,
    });

    if (!result.success) {
      toast.error(result.error.message);
    }
  }, [node.id, editor]);

  const redo = useCallback(async () => {
    if (!editor) {
      return;
    }

    const beforeContent = ydocRef.current.getObject<RichTextContent>();
    const update = ydocRef.current.redo();

    if (!update) {
      return;
    }

    const afterContent = ydocRef.current.getObject<RichTextContent>();

    if (isEqual(beforeContent, afterContent)) {
      return;
    }

    const editorContent = buildEditorContent(node.id, afterContent);
    editor.chain().setContent(editorContent).run();

    const result = await window.colanode.executeMutation({
      type: 'document.update',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      documentId: node.id,
      update,
    });

    if (!result.success) {
      toast.error(result.error.message);
    }
  }, [node.id, editor]);

  return (
    <>
      {editor && canEdit && (
        <Fragment>
          <ToolbarMenu editor={editor} />
          <ActionMenu editor={editor} />
        </Fragment>
      )}
      <EditorContent editor={editor} />
    </>
  );
};
