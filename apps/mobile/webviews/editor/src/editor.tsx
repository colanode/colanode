import { useCallback, useEffect, useRef, useState } from 'react';

import type { DocumentState, DocumentUpdate } from '@colanode/client/types';
import type { LocalNode } from '@colanode/client/types/nodes';
import type { WorkspaceRole } from '@colanode/core';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';

import { DocumentEditor } from './document-editor';
import {
  onNativeMessage,
  postReady,
  type NativeToWebViewMessage,
} from './bridge';

interface InitPayload {
  nodeId: string;
  userId: string;
  accountId: string;
  workspaceId: string;
  rootId: string;
  canEdit: boolean;
  theme: 'light' | 'dark';
  state: string | null;
  updates: string[];
  title: string;
}

interface EditorState {
  nodeId: string;
  userId: string;
  accountId: string;
  workspaceId: string;
  rootId: string;
  canEdit: boolean;
  docState: DocumentState | null;
  docUpdates: DocumentUpdate[];
}

function buildDocState(
  nodeId: string,
  state: string | null
): DocumentState | null {
  if (!state) return null;
  return {
    id: nodeId,
    revision: '0',
    state,
  };
}

function buildDocUpdates(nodeId: string, updates: string[]): DocumentUpdate[] {
  return updates.map((data, i) => ({
    id: `${nodeId}-update-${i}`,
    documentId: nodeId,
    data,
  }));
}

export function MobileEditorApp() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const editorStateRef = useRef<EditorState | null>(null);

  const handleMessage = useCallback((msg: NativeToWebViewMessage) => {
    switch (msg.type) {
      case 'init': {
        const p = msg.payload as InitPayload;

        // Set theme
        if (p.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        const state: EditorState = {
          nodeId: p.nodeId,
          userId: p.userId,
          accountId: p.accountId,
          workspaceId: p.workspaceId,
          rootId: p.rootId,
          canEdit: p.canEdit,
          docState: buildDocState(p.nodeId, p.state),
          docUpdates: buildDocUpdates(p.nodeId, p.updates),
        };
        editorStateRef.current = state;
        setEditorState(state);
        break;
      }

      case 'state.update': {
        const current = editorStateRef.current;
        if (!current) return;

        const updated: EditorState = {
          ...current,
          docState: {
            id: current.nodeId,
            revision: msg.payload.revision,
            state: msg.payload.state,
          },
          docUpdates: buildDocUpdates(
            current.nodeId,
            msg.payload.updates
          ),
        };
        editorStateRef.current = updated;
        setEditorState(updated);
        break;
      }

      case 'theme.change': {
        if (msg.payload.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        break;
      }

      case 'permission.change': {
        const current = editorStateRef.current;
        if (!current) return;

        const updated = { ...current, canEdit: msg.payload.canEdit };
        editorStateRef.current = updated;
        setEditorState(updated);
        break;
      }

      case 'flush': {
        // Flush any pending debounced save immediately
        const flush = (window as unknown as { __editorFlush?: () => void })
          .__editorFlush;
        if (flush) {
          flush();
        }
        break;
      }

      case 'keyboard.show': {
        // After the WebView container resizes, scroll cursor into view
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const container = document.getElementById('scroll-container');
              if (container) {
                const containerRect = container.getBoundingClientRect();
                const cursorBottom =
                  rect.bottom - containerRect.top + container.scrollTop;
                const visibleBottom =
                  container.scrollTop + container.clientHeight - 60;
                if (cursorBottom > visibleBottom) {
                  container.scrollTo({
                    top: cursorBottom - container.clientHeight + 100,
                    behavior: 'smooth',
                  });
                }
              }
            }
          });
        });
        break;
      }

      case 'keyboard.hide': {
        // No-op — container resizes back automatically
        break;
      }

      case 'editor.blur': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ei = (window as any).__editorInstance;
        if (ei) {
          ei.commands.blur();
        }
        break;
      }

      case 'block.command': {
        const { command } = msg.payload as { command: string };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ei = (window as any).__editorInstance;
        if (!ei) break;
        try {
          const chain = ei.chain().focus();
          switch (command) {
            case 'paragraph':
              chain.toggleNode('paragraph', 'paragraph').run();
              break;
            case 'heading1':
              chain.setNode('heading1').run();
              break;
            case 'heading2':
              chain.setNode('heading2').run();
              break;
            case 'heading3':
              chain.setNode('heading3').run();
              break;
            case 'bulletList':
              chain.toggleBulletList().run();
              break;
            case 'orderedList':
              chain.toggleOrderedList().run();
              break;
            case 'taskList':
              chain.toggleTaskList().run();
              break;
            case 'blockquote':
              chain.toggleBlockquote().run();
              break;
            case 'codeBlock':
              chain.toggleCodeBlock().run();
              break;
            case 'divider':
              chain.setHorizontalRule().run();
              break;
            case 'table':
              chain.insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run();
              break;
          }
        } catch (e) {
          // Post error to native for debugging
          const errMsg = e instanceof Error ? e.message : String(e);
          const rn = (window as any).ReactNativeWebView;
          if (rn) {
            rn.postMessage(JSON.stringify({
              type: 'error',
              payload: { message: 'block.command error: ' + errMsg },
            }));
          }
        }
        break;
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onNativeMessage(handleMessage);
    postReady();
    return unsub;
  }, [handleMessage]);

  if (!editorState) {
    return null;
  }

  const node = {
    id: editorState.nodeId,
    rootId: editorState.rootId,
    type: 'page',
    name: '',
    parentId: '',
    index: '',
    attributes: {},
    createdAt: '',
    updatedAt: '',
    createdBy: editorState.userId,
    updatedBy: null,
    transactionId: '',
    localRevision: '0',
    serverRevision: '0',
  } as LocalNode;

  const workspaceCtx = {
    workspaceId: editorState.workspaceId,
    accountId: editorState.accountId,
    userId: editorState.userId,
    role: 'owner' as WorkspaceRole,
    collections: {} as never,
  };

  return (
    <WorkspaceContext.Provider value={workspaceCtx}>
      <div
        style={{
          padding: '0 16px',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          minHeight: '100%',
        }}
      >
        <DocumentEditor
          node={node}
          state={editorState.docState}
          updates={editorState.docUpdates}
          canEdit={editorState.canEdit}
        />
      </div>
    </WorkspaceContext.Provider>
  );
}
