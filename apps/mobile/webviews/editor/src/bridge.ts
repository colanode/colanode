import { EventBusService } from '@colanode/client/lib';
import type { MutationInput, MutationResult } from '@colanode/client/mutations';
import type { QueryInput, QueryMap } from '@colanode/client/queries';
import type { Event } from '@colanode/client/types';
import type { WorkspaceRole } from '@colanode/core';
import type { ColanodeWindowApi } from '@colanode/ui/window';

// Types for messages between WebView and Native
export type NativeToWebViewMessage =
  | {
      type: 'init';
      payload: {
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
      };
    }
  | {
      type: 'state.update';
      payload: { state: string; updates: string[]; revision: string };
    }
  | { type: 'theme.change'; payload: { theme: 'light' | 'dark' } }
  | { type: 'permission.change'; payload: { canEdit: boolean } }
  | {
      type: 'query.response';
      payload: { requestId: string; data: unknown; error?: string };
    }
  | {
      type: 'mutation.response';
      payload: { requestId: string; result: unknown; error?: string };
    }
  | { type: 'flush' }
  | { type: 'keyboard.show'; payload: { height: number } }
  | { type: 'keyboard.hide' }
  | { type: 'editor.blur' }
  | { type: 'block.command'; payload: { command: string } }
  | { type: 'event.publish'; payload: { event: Event } };

export type WebViewToNativeMessage =
  | { type: 'ready' }
  | {
      type: 'mutation.request';
      payload: { requestId: string; input: MutationInput };
    }
  | {
      type: 'query.request';
      payload: { requestId: string; input: QueryInput };
    }
  | {
      type: 'query.subscribe.request';
      payload: { requestId: string; key: string; input: QueryInput };
    }
  | {
      type: 'query.unsubscribe.request';
      payload: { key: string };
    }
  | {
      type: 'navigate.node';
      payload: { nodeId: string; nodeType: string };
    }
  | { type: 'navigate.url'; payload: { url: string } }
  | { type: 'editor.focus'; payload: { focused: boolean } }
  | { type: 'error'; payload: { message: string } };

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT = 10_000;

const pendingRequests = new Map<string, PendingRequest>();

let messageListeners: Array<(msg: NativeToWebViewMessage) => void> = [];

export function onNativeMessage(
  listener: (msg: NativeToWebViewMessage) => void
) {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter((l) => l !== listener);
  };
}

function postToNative(message: WebViewToNativeMessage) {
  const rn = (window as unknown as { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView;
  if (rn) {
    rn.postMessage(JSON.stringify(message));
  }
}

function generateRequestId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sendRequest(
  message:
    | {
        type: 'mutation.request';
        payload: { input: MutationInput };
      }
    | {
        type: 'query.request';
        payload: { input: QueryInput };
      }
    | {
        type: 'query.subscribe.request';
        payload: { key: string; input: QueryInput };
      }
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Bridge request timed out: ${message.type}`));
    }, REQUEST_TIMEOUT);

    pendingRequests.set(requestId, { resolve, reject, timer });
    postToNative({
      ...message,
      payload: {
        ...message.payload,
        requestId,
      },
    } as WebViewToNativeMessage);
  });
}

function handleNativeMessage(event: MessageEvent) {
  let msg: NativeToWebViewMessage;
  try {
    msg =
      typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  } catch {
    return;
  }

  if (!msg || !msg.type) return;

  try {
    // Handle request responses
    if (msg.type === 'mutation.response' || msg.type === 'query.response') {
      const { requestId, error } = msg.payload;
      const pending = pendingRequests.get(requestId);
      if (pending) {
        clearTimeout(pending.timer);
        pendingRequests.delete(requestId);
        if (error) {
          pending.reject(new Error(error));
        } else {
          const data =
            msg.type === 'mutation.response' ? msg.payload.result : msg.payload.data;
          pending.resolve(data);
        }
      }
      return;
    }

    if (msg.type === 'event.publish') {
      window.eventBus.publish(msg.payload.event);
      return;
    }

    // Forward all other messages to listeners
    for (const listener of messageListeners) {
      listener(msg);
    }
  } catch (err) {
    postError(
      `Bridge message handler error (${msg.type}): ${err instanceof Error ? err.stack ?? err.message : String(err)}`
    );
  }
}

// Listen for messages from native
window.addEventListener('message', handleNativeMessage);
document.addEventListener('message', handleNativeMessage as EventListener);

const bridgeApi: ColanodeWindowApi = {
  init: async () => {
    return 'success';
  },

  reset: async () => {},

  executeMutation: async <T extends MutationInput>(
    input: T
  ): Promise<MutationResult<T>> => {
    const result = await sendRequest({
      type: 'mutation.request',
      payload: { input },
    });
    return result as MutationResult<T>;
  },

  executeQuery: async <T extends QueryInput>(
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    const result = await sendRequest({
      type: 'query.request',
      payload: { input },
    });
    return result as QueryMap[T['type']]['output'];
  },

  executeQueryAndSubscribe: async <T extends QueryInput>(
    key: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    const result = await sendRequest({
      type: 'query.subscribe.request',
      payload: { key, input },
    });
    return result as QueryMap[T['type']]['output'];
  },

  unsubscribeQuery: async (key: string) => {
    postToNative({
      type: 'query.unsubscribe.request',
      payload: { key },
    });
  },

  saveTempFile: async () => {
    throw new Error('saveTempFile is not supported in mobile editor');
  },

  openExternalUrl: async (url: string) => {
    postToNative({ type: 'navigate.url', payload: { url } });
  },

  showItemInFolder: async () => {},

  showFileSaveDialog: async () => {
    return undefined;
  },
};

// Install bridge on window
window.colanode = bridgeApi;
window.eventBus = new EventBusService();

export function postReady() {
  postToNative({ type: 'ready' });
}

export function postNavigateNode(nodeId: string, nodeType: string) {
  postToNative({ type: 'navigate.node', payload: { nodeId, nodeType } });
}

export function postEditorFocus(focused: boolean) {
  postToNative({ type: 'editor.focus', payload: { focused } });
}

export function postError(message: string) {
  postToNative({ type: 'error', payload: { message } });
}
