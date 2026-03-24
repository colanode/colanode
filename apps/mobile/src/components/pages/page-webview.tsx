import { Asset } from 'expo-asset';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { eventBus } from '@colanode/client/lib';
import type { Event, DocumentState, DocumentUpdate } from '@colanode/client/types';
import type { WorkspaceRole } from '@colanode/core';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const editorHtmlAsset = require('../../../assets/editor-dist/editor.html');

export interface PageWebViewHandle {
  flush: () => void;
  blur: () => void;
  executeBlockCommand: (command: string) => void;
}

interface PageWebViewProps {
  mode?: 'page' | 'database' | 'record';
  nodeId: string;
  userId: string;
  accountId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  rootId: string;
  canEdit: boolean;
  title: string;
  state: DocumentState | null | undefined;
  updates: DocumentUpdate[];
  keyboardHeight: number;
  onNavigateNode: (nodeId: string, nodeType: string) => void;
  onEditorFocusChange?: (focused: boolean) => void;
}

const buildPendingSubscriptionKey = (windowId: string, key: string) =>
  `${windowId}:${key}`;

export const PageWebView = forwardRef<PageWebViewHandle, PageWebViewProps>(
  (
    {
      mode = 'page',
      nodeId,
      userId,
      accountId,
      workspaceId,
      workspaceRole,
      rootId,
      canEdit,
      title,
      state,
      updates,
      keyboardHeight,
      onNavigateNode,
      onEditorFocusChange,
    },
    ref
  ) => {
  const { appService } = useAppService();
  const { scheme, colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const editorFocusedRef = useRef(false);
  const webViewWindowIdRef = useRef(
    `mobile-webview:${mode}:${nodeId}:${Math.random().toString(36).slice(2)}`
  );
  const subscribedQueryKeysRef = useRef<Set<string>>(new Set());
  const pendingUnsubscribeKeysRef = useRef<Set<string>>(new Set());
  const revisionRef = useRef(state?.revision ?? '0');
  const sentUpdateIdsRef = useRef<Set<string>>(new Set());
  const [editorAsset, setEditorAsset] = useState<{ html: string; baseUrl: string } | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  useEffect(() => {
    const previousWindowId = webViewWindowIdRef.current;
    for (const key of subscribedQueryKeysRef.current) {
      pendingUnsubscribeKeysRef.current.add(
        buildPendingSubscriptionKey(previousWindowId, key)
      );
      appService.mediator.unsubscribeQuery(key, previousWindowId);
    }

    subscribedQueryKeysRef.current.clear();
    webViewWindowIdRef.current = `mobile-webview:${mode}:${nodeId}:${Math.random().toString(36).slice(2)}`;
    isReadyRef.current = false;
    editorFocusedRef.current = false;
    setWebViewReady(false);
    revisionRef.current = '0';
    sentUpdateIdsRef.current.clear();
  }, [appService, mode, nodeId]);

  // Load the HTML content from the asset
  useEffect(() => {
    const loadAsset = async () => {
      const asset = Asset.fromModule(editorHtmlAsset);
      await asset.downloadAsync();
      if (asset.localUri) {
        const resp = await fetch(asset.localUri);
        let html = await resp.text();
        // Polyfill crypto.randomUUID — iOS WebView doesn't provide it
        const polyfill = `<script>(function(){if(typeof window.crypto==='undefined'){window.crypto={};}if(typeof window.crypto.getRandomValues!=='function'){window.crypto.getRandomValues=function(arr){for(var i=0;i<arr.length;i++){arr[i]=Math.floor(Math.random()*256);}return arr;};}if(typeof window.crypto.randomUUID!=='function'){window.crypto.randomUUID=function(){var d=new Uint8Array(16);window.crypto.getRandomValues(d);d[6]=(d[6]&0x0f)|0x40;d[8]=(d[8]&0x3f)|0x80;var h='';for(var i=0;i<16;i++){h+=d[i].toString(16).padStart(2,'0');if(i===3||i===5||i===7||i===9)h+='-';}return h;};}})();</script>`;
        html = html.replace('<head>', '<head>' + polyfill);
        // Apply dark class before first paint to avoid white flash
        if (scheme === 'dark') {
          html = html.replace('<html lang="en">', '<html lang="en" class="dark">');
        }
        // Derive base URL from the asset path so the page gets a file:// origin.
        // Without a real origin, WKWebView masks all error details as "Script error".
        const baseUrl = asset.localUri.replace(/\/[^/]*$/, '/');
        setEditorAsset({ html, baseUrl });
      }
    };
    loadAsset();
  }, []);

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    if (!webViewRef.current) return;
    const json = JSON.stringify(msg);
    webViewRef.current.injectJavaScript(
      `(function(){try{window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(json)}}));}catch(e){window.__colanodeBridgeReportError&&window.__colanodeBridgeReportError('Bridge dispatch error',e);}})();true;`
    );
  }, []);

  const sendInit = useCallback(() => {
    sendMessage({
      type: 'init',
      payload: {
        mode,
        nodeId,
        userId,
        accountId,
        workspaceId,
        workspaceRole,
        rootId,
        canEdit,
        theme: scheme,
        state: state?.state ?? null,
        updates: updates.map((u) => u.data),
        title,
      },
    });
    // Track which updates have been sent to avoid re-sending
    sentUpdateIdsRef.current = new Set(updates.map((u) => u.id));
  }, [
    nodeId,
    mode,
    userId,
    accountId,
    workspaceId,
    workspaceRole,
    rootId,
    canEdit,
    scheme,
    state,
    updates,
    title,
    sendMessage,
  ]);

  useEffect(() => {
    const subscriptionId = eventBus.subscribe((event: Event) => {
      if (!isReadyRef.current) {
        return;
      }

      sendMessage({
        type: 'event.publish',
        payload: { event },
      });
    });

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [sendMessage]);

  // Send state updates when revision changes or new updates arrive
  useEffect(() => {
    if (!isReadyRef.current) return;
    if (!state) return;

    const newUpdates = updates.filter((u) => !sentUpdateIdsRef.current.has(u.id));
    const revisionChanged = revisionRef.current !== state.revision;

    if (!revisionChanged && newUpdates.length === 0) return;

    revisionRef.current = state.revision;
    for (const u of newUpdates) {
      sentUpdateIdsRef.current.add(u.id);
    }

    sendMessage({
      type: 'state.update',
      payload: {
        state: state.state,
        updates: newUpdates.map((u) => u.data),
        revision: state.revision,
      },
    });
  }, [state, updates, sendMessage]);

  // Send theme changes
  useEffect(() => {
    if (!isReadyRef.current) return;
    sendMessage({
      type: 'theme.change',
      payload: { theme: scheme },
    });
  }, [scheme, sendMessage]);

  // Send permission changes
  useEffect(() => {
    if (!isReadyRef.current) return;
    sendMessage({
      type: 'permission.change',
      payload: { canEdit },
    });
  }, [canEdit, sendMessage]);

  // Send keyboard height changes to WebView
  const prevKeyboardHeight = useRef(0);
  useEffect(() => {
    if (!isReadyRef.current) return;
    if (prevKeyboardHeight.current === keyboardHeight) return;
    prevKeyboardHeight.current = keyboardHeight;
    if (!editorFocusedRef.current) return;
    if (keyboardHeight > 0) {
      sendMessage({ type: 'keyboard.show', payload: { height: keyboardHeight } });
    } else {
      sendMessage({ type: 'keyboard.hide' });
    }
  }, [keyboardHeight, sendMessage]);

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let msg: { type: string; payload?: Record<string, unknown> };
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ready': {
          isReadyRef.current = true;
          setWebViewReady(true);
          sendInit();
          break;
        }

        case 'mutation.request': {
          const { requestId, input } = msg.payload as {
            requestId: string;
            input: Record<string, unknown>;
          };
          try {
            const result = await appService.mediator.executeMutation(
              input as never
            );
            sendMessage({
              type: 'mutation.response',
              payload: { requestId, result },
            });
          } catch (err) {
            sendMessage({
              type: 'mutation.response',
              payload: {
                requestId,
                result: null,
                error:
                  err instanceof Error ? err.message : 'Mutation failed',
              },
            });
          }
          break;
        }

        case 'query.request': {
          const { requestId, input } = msg.payload as {
            requestId: string;
            input: Record<string, unknown>;
          };

          // Inject the actual userId for queries that come with empty userId
          const queryInput = { ...input };
          if (!queryInput.userId) {
            queryInput.userId = userId;
          }

          try {
            let data = await appService.mediator.executeQuery(
              queryInput as never
            );
            // Convert file:// URLs to base64 data URLs for the WebView
            if (
              queryInput.type === 'local.file.get' &&
              data &&
              typeof data === 'object'
            ) {
              const localFile = data as {
                url?: string;
                path?: string;
                downloadStatus?: number;
              };
              if (
                localFile.downloadStatus === 2 &&
                localFile.url &&
                localFile.url.startsWith('file://')
              ) {
                try {
                  const resp = await fetch(localFile.url);
                  const blob = await resp.blob();
                  const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                  data = { ...localFile, url: base64 } as typeof data;
                } catch (e) {
                  console.warn('[PageWebView] Failed to convert file to base64:', e);
                }
              }
            }
            sendMessage({
              type: 'query.response',
              payload: { requestId, data },
            });
          } catch (err) {
            sendMessage({
              type: 'query.response',
              payload: {
                requestId,
                data: null,
                error: err instanceof Error ? err.message : 'Query failed',
              },
            });
          }
          break;
        }

        case 'query.subscribe.request': {
          const { requestId, key, input } = msg.payload as {
            requestId: string;
            key: string;
            input: Record<string, unknown>;
          };

          const queryInput = { ...input };
          if (!queryInput.userId) {
            queryInput.userId = userId;
          }

          try {
            const windowId = webViewWindowIdRef.current;
            const pendingKey = buildPendingSubscriptionKey(windowId, key);

            pendingUnsubscribeKeysRef.current.delete(pendingKey);
            subscribedQueryKeysRef.current.add(key);
            const data = await appService.mediator.executeQueryAndSubscribe(
              key,
              windowId,
              queryInput as never
            );

            if (pendingUnsubscribeKeysRef.current.has(pendingKey)) {
              pendingUnsubscribeKeysRef.current.delete(pendingKey);
              subscribedQueryKeysRef.current.delete(key);
              appService.mediator.unsubscribeQuery(key, windowId);
            }

            sendMessage({
              type: 'query.response',
              payload: { requestId, data },
            });
          } catch (err) {
            sendMessage({
              type: 'query.response',
              payload: {
                requestId,
                data: null,
                error: err instanceof Error ? err.message : 'Query failed',
              },
            });
          }
          break;
        }

        case 'query.unsubscribe.request': {
          const { key } = msg.payload as { key: string };
          pendingUnsubscribeKeysRef.current.add(
            buildPendingSubscriptionKey(webViewWindowIdRef.current, key)
          );
          subscribedQueryKeysRef.current.delete(key);
          appService.mediator.unsubscribeQuery(key, webViewWindowIdRef.current);
          break;
        }

        case 'editor.focus': {
          const { focused } = msg.payload as { focused: boolean };
          editorFocusedRef.current = focused;
          if (focused && keyboardHeight > 0) {
            sendMessage({
              type: 'keyboard.show',
              payload: { height: keyboardHeight },
            });
          } else if (!focused) {
            sendMessage({ type: 'keyboard.hide' });
          }
          onEditorFocusChange?.(focused);
          break;
        }

        case 'navigate.node': {
          const { nodeId: navNodeId, nodeType } = msg.payload as {
            nodeId: string;
            nodeType: string;
          };
          onNavigateNode(navNodeId, nodeType);
          break;
        }

        case 'navigate.url': {
          const { url } = msg.payload as { url: string };
          Linking.openURL(url).catch(() => {});
          break;
        }

        case 'error': {
          const { message } = msg.payload as { message: string };
          console.error('[WebView Editor]', message);
          break;
        }
      }
    },
    [
      appService,
      keyboardHeight,
      onEditorFocusChange,
      onNavigateNode,
      sendInit,
      sendMessage,
      userId,
    ]
  );

  useEffect(() => {
    return () => {
      const windowId = webViewWindowIdRef.current;
      for (const key of subscribedQueryKeysRef.current) {
        pendingUnsubscribeKeysRef.current.add(
          buildPendingSubscriptionKey(windowId, key)
        );
        appService.mediator.unsubscribeQuery(key, windowId);
      }
      subscribedQueryKeysRef.current.clear();
    };
  }, [appService]);

  const sendFlush = useCallback(() => {
    if (!isReadyRef.current) return;
    sendMessage({ type: 'flush' });
  }, [sendMessage]);

  useImperativeHandle(
    ref,
    () => ({
      flush: sendFlush,
      blur: () => sendMessage({ type: 'editor.blur' }),
      executeBlockCommand: (command: string) =>
        sendMessage({ type: 'block.command', payload: { command } }),
    }),
    [sendFlush, sendMessage]
  );

  if (!editorAsset) {
    return (
      <View style={[styles.container, styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!webViewReady && (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      )}
      <WebView
        key={`${mode}:${nodeId}`}
        ref={webViewRef}
        source={{ html: editorAsset.html, baseUrl: editorAsset.baseUrl }}
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            if (typeof window.crypto === 'undefined') {
              window.crypto = {};
            }
            if (typeof window.crypto.getRandomValues !== 'function') {
              window.crypto.getRandomValues = function(arr) {
                for (var i = 0; i < arr.length; i++) {
                  arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
              };
            }
            if (typeof window.crypto.randomUUID !== 'function') {
              window.crypto.randomUUID = function() {
                var d = new Uint8Array(16);
                window.crypto.getRandomValues(d);
                d[6] = (d[6] & 0x0f) | 0x40;
                d[8] = (d[8] & 0x3f) | 0x80;
                var h = '';
                for (var i = 0; i < 16; i++) {
                  h += d[i].toString(16).padStart(2, '0');
                  if (i === 3 || i === 5 || i === 7 || i === 9) h += '-';
                }
                return h;
              };
            }
          })();
          window.__colanodeBridgeReportError = function(prefix, value) {
            var message = prefix;
            if (value) {
              if (value.stack) {
                message += ': ' + value.stack;
              } else if (value.message) {
                message += ': ' + value.message;
              } else {
                message += ': ' + String(value);
              }
            }
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              payload: { message: message }
            }));
          };
          window.addEventListener('error', function(event) {
            window.__colanodeBridgeReportError('JS Error', event.error || (event.message + ' at ' + event.filename + ':' + event.lineno + ':' + event.colno));
          });
          window.addEventListener('unhandledrejection', function(e) {
            window.__colanodeBridgeReportError('Unhandled rejection', e.reason);
          });
          window.onerror = function(msg, url, line, col, err) {
            window.__colanodeBridgeReportError('JS Error', err || (msg + ' at ' + url + ':' + line + ':' + col));
          };

          true;
        `}
        style={[
          styles.webview,
          { backgroundColor: colors.background },
          !webViewReady && styles.hidden,
        ]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        hideKeyboardAccessoryView
        automaticallyAdjustContentInsets={false}
        contentMode="mobile"
        onMessage={handleMessage}
        onError={(e) => {
          console.error('[WebView Error]', e.nativeEvent.description);
        }}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowsBackForwardNavigationGestures={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        {...(Platform.OS === 'android' && {
          androidLayerType: 'hardware',
        })}
      />
    </View>
  );
  }
);
PageWebView.displayName = 'PageWebView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
