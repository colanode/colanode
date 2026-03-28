import '@colanode/ui/styles/editor.css';

import { EditorContent, type FocusPosition, useEditor } from '@tiptap/react';
import { isEqual } from 'lodash-es';
import { Fragment, useRef } from 'react';
import { toast } from 'sonner';

import { buildEditorContent } from '@colanode/client/lib';
import type {
  LocalNode,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types';
import { type RichTextContent } from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';
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
  CommanderExtension,
  FileNode,
  FolderNode,
  PageNode,
  DatabaseNode,
} from '@colanode/ui/editor/extensions';
import { ToolbarMenu, ActionMenu } from '@colanode/ui/editor/menus';

import { useDocumentEditor } from './use-document-editor';

interface DocumentEditorProps {
  node: LocalNode;
  state: DocumentState | null | undefined;
  updates: DocumentUpdate[];
  canEdit: boolean;
  autoFocus?: FocusPosition;
}

interface UndoRedoParams {
  editor: ReturnType<typeof useEditor>;
  ydoc: YDoc;
  nodeId: string;
  userId: string;
}

const performUndo = async ({
  editor,
  ydoc,
  nodeId,
  userId,
}: UndoRedoParams) => {
  const beforeContent = ydoc.getObject<RichTextContent>();
  const update = ydoc.undo();

  if (!update) {
    return;
  }

  const afterContent = ydoc.getObject<RichTextContent>();

  if (isEqual(beforeContent, afterContent)) {
    return;
  }

  const editorContent = buildEditorContent(nodeId, afterContent);
  editor.chain().setContent(editorContent).run();

  const result = await window.colanode.executeMutation({
    type: 'document.update',
    userId,
    documentId: nodeId,
    update: encodeState(update),
  });

  if (!result.success) {
    toast.error(result.error.message);
  }
};

const performRedo = async ({
  editor,
  ydoc,
  nodeId,
  userId,
}: UndoRedoParams) => {
  const beforeContent = ydoc.getObject<RichTextContent>();
  const update = ydoc.redo();

  if (!update) {
    return;
  }

  const afterContent = ydoc.getObject<RichTextContent>();

  if (isEqual(beforeContent, afterContent)) {
    return;
  }

  const editorContent = buildEditorContent(nodeId, afterContent);
  editor.chain().setContent(editorContent).run();

  const result = await window.colanode.executeMutation({
    type: 'document.update',
    userId,
    documentId: nodeId,
    update: encodeState(update),
  });

  if (!result.success) {
    toast.error(result.error.message);
  }
};

export const DocumentEditor = ({
  node,
  state,
  updates,
  canEdit,
  autoFocus,
}: DocumentEditorProps) => {
  const workspace = useWorkspace();
  const editorLocalRef = useRef<ReturnType<typeof useEditor>>(null);

  const { editor, ydocRef } = useDocumentEditor({
    node,
    state,
    updates,
    canEdit,
    autoFocus,
    platformExtensions: [
      PageNode,
      FolderNode,
      FileNode.configure({
        context: {
          userId: workspace.userId,
          accountId: workspace.accountId,
          workspaceId: workspace.workspaceId,
          documentId: node.id,
          rootId: node.rootId,
        },
      }),
      DatabaseNode,
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
          workspaceId: workspace.workspaceId,
          rootId: node.rootId,
        },
      }),
    ],
    editorProps: {
      handleKeyDown: (_, event) => {
        if (!editorLocalRef.current) {
          return false;
        }

        if (event.key === 'z' && event.metaKey && !event.shiftKey) {
          event.preventDefault();
          performUndo({
            editor: editorLocalRef.current,
            ydoc: ydocRef.current,
            nodeId: node.id,
            userId: workspace.userId,
          });
          return true;
        }
        if (event.key === 'z' && event.metaKey && event.shiftKey) {
          event.preventDefault();
          performRedo({
            editor: editorLocalRef.current,
            ydoc: ydocRef.current,
            nodeId: node.id,
            userId: workspace.userId,
          });
          return true;
        }
        if (event.key === 'y' && event.metaKey) {
          event.preventDefault();
          performRedo({
            editor: editorLocalRef.current,
            ydoc: ydocRef.current,
            nodeId: node.id,
            userId: workspace.userId,
          });
          return true;
        }
      },
    },
  });

  // Keep local ref in sync for undo/redo handleKeyDown
  editorLocalRef.current = editor;

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
