import { useCallback, useEffect, useRef, useState } from 'react';

import type { DocumentState, DocumentUpdate } from '@colanode/client/types';
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
        // The DocumentEditor uses a debounced save.
        // We trigger a blur to force any pending changes to flush.
        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLElement) {
          activeEl.blur();
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
    type: 'page' as const,
    name: '',
    parentId: '',
    index: '',
    attributes: {},
    createdAt: '',
    updatedAt: '',
    createdBy: editorState.userId,
    transactionId: '',
  };

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
          minHeight: '100vh',
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
