import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';

import type { DocumentState, DocumentUpdate } from '@colanode/client/types';

import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const editorHtmlAsset = require('../../../assets/editor-dist/editor.html');

interface PageWebViewProps {
  nodeId: string;
  userId: string;
  accountId: string;
  workspaceId: string;
  rootId: string;
  canEdit: boolean;
  title: string;
  state: DocumentState | null | undefined;
  updates: DocumentUpdate[];
  onNavigateNode: (nodeId: string, nodeType: string) => void;
}

export const PageWebView = ({
  nodeId,
  userId,
  accountId,
  workspaceId,
  rootId,
  canEdit,
  title,
  state,
  updates,
  onNavigateNode,
}: PageWebViewProps) => {
  const { appService } = useAppService();
  const { scheme, colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const revisionRef = useRef(state?.revision ?? '0');
  const [editorHtml, setEditorHtml] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  // Load the HTML content from the asset
  useEffect(() => {
    const loadAsset = async () => {
      const asset = Asset.fromModule(editorHtmlAsset);
      await asset.downloadAsync();
      if (asset.localUri) {
        const resp = await fetch(asset.localUri);
        let html = await resp.text();
        // Polyfill crypto.randomUUID — iOS WebView doesn't provide it
        const polyfill = `<script>if(!crypto.randomUUID){crypto.randomUUID=function(){var d=new Uint8Array(16);crypto.getRandomValues(d);d[6]=(d[6]&0x0f)|0x40;d[8]=(d[8]&0x3f)|0x80;var h='';for(var i=0;i<16;i++){h+=d[i].toString(16).padStart(2,'0');if(i===3||i===5||i===7||i===9)h+='-';}return h;};}</script>`;
        html = html.replace('<head>', '<head>' + polyfill);
        // Apply dark class before first paint to avoid white flash
        if (scheme === 'dark') {
          html = html.replace('<html lang="en">', '<html lang="en" class="dark">');
        }
        setEditorHtml(html);
      }
    };
    loadAsset();
  }, []);

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    if (!webViewRef.current) return;
    const json = JSON.stringify(msg);
    webViewRef.current.injectJavaScript(
      `(function(){try{window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(json)}}));}catch(e){}})();true;`
    );
  }, []);

  const sendInit = useCallback(() => {
    sendMessage({
      type: 'init',
      payload: {
        nodeId,
        userId,
        accountId,
        workspaceId,
        rootId,
        canEdit,
        theme: scheme,
        state: state?.state ?? null,
        updates: updates.map((u) => u.data),
        title,
      },
    });
  }, [
    nodeId,
    userId,
    accountId,
    workspaceId,
    rootId,
    canEdit,
    scheme,
    state,
    updates,
    title,
    sendMessage,
  ]);

  // Send state updates when revision changes
  useEffect(() => {
    if (!isReadyRef.current) return;
    if (!state) return;
    if (revisionRef.current === state.revision) return;

    revisionRef.current = state.revision;
    sendMessage({
      type: 'state.update',
      payload: {
        state: state.state,
        updates: updates.map((u) => u.data),
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
    [appService, userId, sendInit, sendMessage, onNavigateNode]
  );

  const sendFlush = useCallback(() => {
    if (!isReadyRef.current) return;
    sendMessage({ type: 'flush' });
  }, [sendMessage]);

  // Expose flush for parent component
  useEffect(() => {
    // Store ref for external access
    (PageWebView as unknown as { flushRef: (() => void) | null }).flushRef =
      sendFlush;
    return () => {
      (PageWebView as unknown as { flushRef: (() => void) | null }).flushRef =
        null;
    };
  }, [sendFlush]);

  if (!editorHtml) {
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
        ref={webViewRef}
        source={{ html: editorHtml, baseUrl: '' }}
        injectedJavaScriptBeforeContentLoaded={`
          if (!crypto.randomUUID) {
            crypto.randomUUID = function() {
              var d = new Uint8Array(16);
              crypto.getRandomValues(d);
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
          window.onerror = function(msg, url, line, col, err) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              payload: { message: 'JS Error: ' + msg + ' at ' + url + ':' + line + ':' + col }
            }));
          };
          window.addEventListener('unhandledrejection', function(e) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              payload: { message: 'Unhandled rejection: ' + (e.reason && e.reason.message || e.reason || 'unknown') }
            }));
          });

          // Prevent scroll-to-top on focus: save scroll container position and restore it
          document.addEventListener('DOMContentLoaded', function() {
            var sc = document.getElementById('scroll-container');
            if (!sc) return;
            var saved = 0;
            sc.addEventListener('scroll', function() { saved = sc.scrollTop; }, { passive: true });
            document.addEventListener('focusin', function() {
              var s = saved;
              // Restore after browser/ProseMirror auto-scroll
              requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                  if (Math.abs(sc.scrollTop - s) > 50) {
                    sc.scrollTop = s;
                  }
                });
              });
            }, true);
          });
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
};

// Static ref for flush access from parent
(PageWebView as unknown as { flushRef: (() => void) | null }).flushRef = null;

export const flushPageWebView = () => {
  const ref = (PageWebView as unknown as { flushRef: (() => void) | null })
    .flushRef;
  ref?.();
};

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
