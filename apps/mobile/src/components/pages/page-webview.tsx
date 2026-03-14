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
import * as FileSystem from 'expo-file-system';

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

  // Load the HTML content from the asset
  useEffect(() => {
    const loadAsset = async () => {
      const asset = Asset.fromModule(editorHtmlAsset);
      await asset.downloadAsync();
      if (asset.localUri) {
        const html = await FileSystem.readAsStringAsync(asset.localUri);
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
            const data = await appService.mediator.executeQuery(
              queryInput as never
            );
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
      <WebView
        ref={webViewRef}
        source={{ html: editorHtml }}
        style={[styles.webview, { backgroundColor: colors.background }]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled
        bounces={false}
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        contentMode="mobile"
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.textMuted} />
          </View>
        )}
        onMessage={handleMessage}
        onError={(e) => {
          console.error('[WebView Error]', e.nativeEvent.description);
        }}
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
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
