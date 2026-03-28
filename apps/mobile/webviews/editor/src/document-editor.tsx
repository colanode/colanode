import '@colanode/ui/styles/editor.css';

import { EditorContent, type FocusPosition } from '@tiptap/react';
import { useEffect } from 'react';

import type {
  LocalNode,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  BlockquoteCommand,
  BulletListCommand,
  CodeBlockCommand,
  DatabaseCommand,
  DatabaseInlineCommand,
  DividerCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  OrderedListCommand,
  ParagraphCommand,
  TableCommand,
  TodoCommand,
} from '@colanode/ui/editor/commands';
import { CommanderExtension } from '@colanode/ui/editor/extensions';
import { isSlashCommandActive } from '@colanode/ui/editor/extensions/commander';
import { useDocumentEditor } from '@colanode/ui/components/documents/use-document-editor';

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

export const DocumentEditor = ({
  node,
  state,
  updates,
  canEdit,
  autoFocus,
}: DocumentEditorProps) => {
  const workspace = useWorkspace();

  const { editor, hasPendingChanges, debouncedSave } = useDocumentEditor({
    node,
    state,
    updates,
    canEdit,
    autoFocus,
    platformExtensions: [
      MobilePageNode,
      MobileFolderNode,
      MobileFileNode,
      MobileDatabaseNode,
      CommanderExtension.configure({
        commands: [
          ParagraphCommand,
          BlockquoteCommand,
          Heading1Command,
          Heading2Command,
          Heading3Command,
          DatabaseInlineCommand,
          DatabaseCommand,
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
    ],
    editorProps: {
      attributes: {
        spellCheck: 'true',
      },
      handleDOMEvents: {
        mousedown: (_view: unknown, event: MouseEvent) => {
          if (isSlashCommandActive()) {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
    },
    onFocus: () => postEditorFocus(true),
    onBlur: () => postEditorFocus(false),
  });

  // Register flush callback so pending saves are not lost on navigation/background
  useEffect(() => {
    type FlushWindow = Window &
      typeof globalThis & {
        __flushCallbacks?: Array<() => void>;
      };
    const win = window as FlushWindow;
    if (!win.__flushCallbacks) {
      win.__flushCallbacks = [];
    }
    const flushCb = () => {
      if (hasPendingChanges.current && editor) {
        debouncedSave.flush();
      }
    };
    win.__flushCallbacks.push(flushCb);
    return () => {
      win.__flushCallbacks = win.__flushCallbacks?.filter(
        (cb) => cb !== flushCb
      );
    };
  }, [debouncedSave, editor, hasPendingChanges]);

  // Expose editor instance for bridge commands (blur, block commands)
  useEffect(() => {
    (
      window as unknown as { __editorInstance?: typeof editor }
    ).__editorInstance = editor;
    return () => {
      delete (window as unknown as { __editorInstance?: typeof editor })
        .__editorInstance;
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
};
