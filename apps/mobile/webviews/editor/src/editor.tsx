import { QueryClientProvider } from '@tanstack/react-query';
import { Component, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import type { DocumentState, DocumentUpdate } from '@colanode/client/types';
import type { LocalNode } from '@colanode/client/types/nodes';
import { WorkspaceStatus, type WorkspaceRole } from '@colanode/core';
import { AppContext } from '@colanode/ui/contexts/app';
import { collections } from '@colanode/ui/collections';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { buildQueryClient } from '@colanode/ui/lib/query';
import { DatabaseCommand, DatabaseInlineCommand } from '@colanode/ui/editor/commands';

import { MobileDatabaseRuntime } from './database-runtime';
import { DocumentEditor } from './document-editor';
import {
  onNativeMessage,
  postEditorFocus,
  postError,
  postReady,
  type NativeToWebViewMessage,
} from './bridge';
import { MobileRecordRuntime } from './record-runtime';

class EditorErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const details = `React error: ${error.stack ?? error.message}${info.componentStack ? `\nComponent stack: ${info.componentStack}` : ''}`;
    postError(details);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: 'red', fontSize: 12 }}>
          <p>
            <strong>Editor error:</strong> {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface InitPayload {
  mode: 'page' | 'database' | 'record';
  nodeId: string;
  userId: string;
  accountId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  rootId: string;
  canEdit: boolean;
  theme: 'light' | 'dark';
  state: string | null;
  updates: string[];
  title: string;
}

interface EditorState {
  mode: 'page' | 'database' | 'record';
  nodeId: string;
  userId: string;
  accountId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
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

function buildDocUpdates(
  nodeId: string,
  updates: string[],
  startIndex = 0
): DocumentUpdate[] {
  return updates.map((data, i) => ({
    id: `${nodeId}-update-${startIndex + i}`,
    documentId: nodeId,
    data,
  }));
}

export function MobileEditorApp() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const editorStateRef = useRef<EditorState | null>(null);
  const preloadPromiseRef = useRef<Promise<void> | null>(null);
  const queryClientRef = useRef<ReturnType<typeof buildQueryClient> | null>(
    null
  );

  if (queryClientRef.current === null) {
    queryClientRef.current = buildQueryClient();
  }

  const ensureCollectionsReady = useCallback(async () => {
    if (!preloadPromiseRef.current) {
      preloadPromiseRef.current = collections.preload();
    }

    await preloadPromiseRef.current;
  }, []);

  const handleMessage = useCallback((msg: NativeToWebViewMessage) => {
    switch (msg.type) {
      case 'init': {
        const p = msg.payload as InitPayload;
        setRuntimeReady(false);

        // Set theme
        if (p.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        const state: EditorState = {
          mode: p.mode,
          nodeId: p.nodeId,
          userId: p.userId,
          accountId: p.accountId,
          workspaceId: p.workspaceId,
          workspaceRole: p.workspaceRole,
          rootId: p.rootId,
          canEdit: p.canEdit,
          docState: buildDocState(p.nodeId, p.state),
          docUpdates: buildDocUpdates(p.nodeId, p.updates),
        };
        void ensureCollectionsReady().then(() => {
          if (!collections.workspaces.has(p.userId)) {
            collections.workspaces.insert({
              userId: p.userId,
              workspaceId: p.workspaceId,
              accountId: p.accountId,
              role: p.workspaceRole,
              name: '',
              description: null,
              avatar: null,
              status: WorkspaceStatus.Active,
              maxFileSize: undefined,
            });
          }

          editorStateRef.current = state;
          setEditorState(state);
          setRuntimeReady(true);
        });
        break;
      }

      case 'state.update': {
        const current = editorStateRef.current;
        if (!current) return;
        const nextUpdates = buildDocUpdates(
          current.nodeId,
          msg.payload.updates,
          current.docUpdates.length
        );

        const updated: EditorState = {
          ...current,
          docState: {
            id: current.nodeId,
            revision: msg.payload.revision,
            state: msg.payload.state,
          },
          // Keep a stable local sequence so incremental batches are distinct.
          docUpdates: [...current.docUpdates, ...nextUpdates],
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
        // Flush any pending debounced save immediately.
        // 1. Call all registered flush callbacks (TipTap editor, etc.)
        const callbacks = (
          window as unknown as { __flushCallbacks?: Array<() => void> }
        ).__flushCallbacks;
        if (callbacks) {
          for (const cb of callbacks) {
            try {
              cb();
            } catch {
              // ignore flush errors
            }
          }
        }
        // 2. Blur the active element so input-based components (record name,
        //    field values) commit their pending debounced mutations via their
        //    own blur/change handlers before the WebView is torn down.
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement
        ) {
          document.activeElement.blur();
        }
        break;
      }

      case 'keyboard.show': {
        const kbHeight = (msg.payload as { height: number }).height;
        // Use the keyboard height to calculate the actual visible area,
        // since the WebView container may not have resized yet.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const container = document.getElementById('scroll-container');
            if (!container) return;

            // Store keyboard height for CSS use
            document.documentElement.style.setProperty(
              '--keyboard-height',
              `${kbHeight}px`
            );

            const activeElement = document.activeElement;
            let focusBottom: number | null = null;

            if (
              activeElement instanceof HTMLInputElement ||
              activeElement instanceof HTMLTextAreaElement ||
              activeElement instanceof HTMLSelectElement
            ) {
              focusBottom = activeElement.getBoundingClientRect().bottom;
            } else {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                try {
                  focusBottom = selection
                    .getRangeAt(0)
                    .getBoundingClientRect().bottom;
                } catch {
                  focusBottom = null;
                }
              }
            }

            if (focusBottom == null) {
              return;
            }

            const viewportHeight = window.innerHeight;
            // The visible area ends where the keyboard begins
            const visibleBottom = viewportHeight - kbHeight - 60;
            if (focusBottom > visibleBottom) {
              // Scroll so the focused control stays comfortably above the keyboard
              const scrollBy = focusBottom - visibleBottom + 40;
              container.scrollBy({
                top: scrollBy,
                behavior: 'smooth',
              });
            }
          });
        });
        break;
      }

      case 'keyboard.hide': {
        document.documentElement.style.setProperty(
          '--keyboard-height',
          '0px'
        );
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
        const current = editorStateRef.current;
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
            case 'databaseInline':
              if (!current) {
                break;
              }
              void DatabaseInlineCommand.handler({
                editor: ei,
                range: {
                  from: ei.state.selection.from,
                  to: ei.state.selection.to,
                },
                context: {
                  userId: current.userId,
                  documentId: current.nodeId,
                  accountId: current.accountId,
                  workspaceId: current.workspaceId,
                  rootId: current.rootId,
                },
              });
              break;
            case 'database':
              if (!current) {
                break;
              }
              void DatabaseCommand.handler({
                editor: ei,
                range: {
                  from: ei.state.selection.from,
                  to: ei.state.selection.to,
                },
                context: {
                  userId: current.userId,
                  documentId: current.nodeId,
                  accountId: current.accountId,
                  workspaceId: current.workspaceId,
                  rootId: current.rootId,
                },
              });
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
  }, [ensureCollectionsReady]);

  useEffect(() => {
    const unsub = onNativeMessage(handleMessage);
    postReady();
    return unsub;
  }, [handleMessage]);

  // Global focus tracking: report focus/blur for ALL interactive elements
  // (inputs, textareas, selects, contentEditable) to native so keyboard
  // avoidance works for database/record inputs, not just the TipTap editor.
  useEffect(() => {
    const isInteractive = (el: Element): boolean =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el as HTMLElement).isContentEditable;

    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Element && isInteractive(e.target)) {
        postEditorFocus(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      if (e.target instanceof Element && isInteractive(e.target)) {
        // Defer so we can check if focus moved to another interactive element
        requestAnimationFrame(() => {
          const next = document.activeElement;
          if (!next || !isInteractive(next)) {
            postEditorFocus(false);
          }
        });
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (!editorState || !runtimeReady) {
    return null;
  }

  const nodeType = editorState.mode === 'record' ? 'record' : 'page';
  const node = {
    id: editorState.nodeId,
    rootId: editorState.rootId,
    type: nodeType,
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

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AppContext.Provider value={{ type: 'mobile' }}>
        <WorkspaceContext.Provider
          value={{
            workspaceId: editorState.workspaceId,
            accountId: editorState.accountId,
            userId: editorState.userId,
            role: editorState.workspaceRole,
            collections: collections.workspace(editorState.userId),
          }}
        >
          <EditorErrorBoundary>
            <div
              style={{
                padding: '0 16px',
                paddingBottom: 'env(safe-area-inset-bottom, 20px)',
                minHeight: '100%',
              }}
            >
              {editorState.mode === 'database' ? (
                <MobileDatabaseRuntime databaseId={editorState.nodeId} />
              ) : editorState.mode === 'record' ? (
                <MobileRecordRuntime
                  recordId={editorState.nodeId}
                  state={editorState.docState}
                  updates={editorState.docUpdates}
                />
              ) : (
                <DocumentEditor
                  node={node}
                  state={editorState.docState}
                  updates={editorState.docUpdates}
                  canEdit={editorState.canEdit}
                />
              )}
            </div>
          </EditorErrorBoundary>
        </WorkspaceContext.Provider>
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
