import { Asset } from 'expo-asset';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { Message } from '@colanode/mobile/lib/types';
import { app } from '@colanode/mobile/services/app-service';

import indexHtml from '../assets/ui/index.html';

export const App = () => {
  const [uri, setUri] = useState<string | null>(null);
  const [baseDir, setBaseDir] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      const indexAsset = Asset.fromModule(indexHtml);
      await indexAsset.downloadAsync(); // no-op in prod
      const localUri = indexAsset.localUri ?? indexAsset.uri;
      const dir = localUri.replace(/index\.html$/, '');
      setUri(localUri);
      setBaseDir(dir);
    })();
  }, []);

  const handleMessage = useCallback(async (e: WebViewMessageEvent) => {
    const message = JSON.parse(e.nativeEvent.data) as Message;
    console.log('message', message);
    if (message.type === 'console') {
      console.log(
        `[WebView ${message.level.toUpperCase()}] ${message.timestamp} ${message.message}`
      );
    } else if (message.type === 'init') {
      await app.migrate();
      await app.init();
      sendMessage({ type: 'init_result' });
    } else if (message.type === 'mutation') {
      const result = await app.mediator.executeMutation(message.input);
      sendMessage({
        type: 'mutation_result',
        mutationId: message.mutationId,
        result,
      });
    } else if (message.type === 'query') {
      const result = await app.mediator.executeQuery(message.input);
      sendMessage({ type: 'query_result', queryId: message.queryId, result });
    } else if (message.type === 'query_and_subscribe') {
      const result = await app.mediator.executeQueryAndSubscribe(
        message.key,
        message.windowId,
        message.input
      );
      console.log('result', result);
      sendMessage({
        type: 'query_and_subscribe_result',
        queryId: message.queryId,
        key: message.key,
        windowId: message.windowId,
        result,
      });
    } else if (message.type === 'query_unsubscribe') {
      app.mediator.unsubscribeQuery(message.key, message.windowId);
    }
  }, []);

  const sendMessage = useCallback((message: Message) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  if (!uri) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      style={{ flex: 1 }}
      originWhitelist={['*']}
      allowFileAccess
      allowFileAccessFromFileURLs
      allowingReadAccessToURL={
        Platform.OS === 'ios' ? (baseDir ?? uri) : undefined
      }
      source={{ uri }}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      onMessage={handleMessage}
    />
  );
};
