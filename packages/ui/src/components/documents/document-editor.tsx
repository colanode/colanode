import '@colanode/ui/styles/editor.css';

import {
  EditorContent,
  FocusPosition,
  JSONContent,
  useEditor,
} from '@tiptap/react';
import { debounce, isEqual } from 'lodash-es';
import { Fragment, useEffect, useMemo, useRef } from 'react';
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
  TodoCommand,
  DatabaseCommand,
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
  TaskItemNode,
  TaskListNode,
  TextNode,
  TrailingNode,
  UnderlineMark,
  DatabaseNode,
  AutoJoiner,
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
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            documentId: node.id,
            rootId: node.rootId,
          },
        }),
        TextNode,
        ParagraphNode,
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
            DatabaseCommand,
            DividerCommand,
            TodoCommand,
            FileCommand,
            FolderCommand,
          ],
          context: {
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
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
          spellCheck: 'false',
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

    const newYDoc = buildYDoc(state, updates);
    const afterContent = newYDoc.getObject<RichTextContent>();
    const beforeContent = ydocRef.current.getObject<RichTextContent>();

    if (isEqual(afterContent, beforeContent)) {
      return;
    }

    ydocRef.current = newYDoc;
    const editorContent = buildEditorContent(node.id, afterContent);
    revisionRef.current = state.revision;

    const relativeSelection = getRelativeSelection(editor);
    editor.chain().setContent(editorContent).run();

    if (relativeSelection != null) {
      restoreRelativeSelection(editor, relativeSelection);
    }
  }, [state, updates, editor]);

  return (
    <div className="min-h-[500px]">
      {editor && canEdit && (
        <Fragment>
          <ToolbarMenu editor={editor} />
          <ActionMenu editor={editor} />
        </Fragment>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
