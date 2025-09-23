import { Asset } from 'expo-asset';
import { modelName } from 'expo-device';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { eventBus } from '@colanode/client/lib';
import { AppMeta, AppService } from '@colanode/client/services';
import { generateId, IdType } from '@colanode/core';
import { copyAssets, indexHtmlAsset } from '@colanode/mobile/lib/assets';
import { Message } from '@colanode/mobile/lib/types';
import { MobileFileSystem } from '@colanode/mobile/services/file-system';
import { MobileKyselyService } from '@colanode/mobile/services/kysely-service';
import { MobilePathService } from '@colanode/mobile/services/path-service';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
});

export const App = () => {
  const windowId = useRef<string>(generateId(IdType.Window));
  const webViewRef = useRef<WebView>(null);
  const app = useRef<AppService | null>(null);
  const appInitialized = useRef<boolean>(false);

  const [uri, setUri] = useState<string | null>(null);
  const [baseDir, setBaseDir] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const indexAsset = Asset.fromModule(indexHtmlAsset);
      await indexAsset.downloadAsync();
      const localUri = indexAsset.localUri ?? indexAsset.uri;
      const dir = localUri.replace(/index\.html$/, '');
      setUri(localUri);
      setBaseDir(dir);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const paths = new MobilePathService();
        await copyAssets(paths);

        const appMeta: AppMeta = {
          type: 'mobile',
          platform: modelName ?? 'unknown',
        };

        app.current = new AppService(
          appMeta,
          new MobileFileSystem(),
          new MobileKyselyService(),
          paths
        );

        await app.current.migrate();
        await app.current.init();
        appInitialized.current = true;
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    const id = eventBus.subscribe((event) => {
      sendMessage({ type: 'event', windowId: windowId.current, event });
    });

    return () => eventBus.unsubscribe(id);
  }, []);

  const handleMessage = useCallback(async (e: WebViewMessageEvent) => {
    const message = JSON.parse(e.nativeEvent.data) as Message;
    if (message.type === 'console') {
      if (message.level === 'log') {
        console.log(
          `[WebView ${message.level.toUpperCase()}] ${message.timestamp} ${message.message}`
        );
      } else if (message.level === 'warn') {
        console.warn(
          `[WebView ${message.level.toUpperCase()}] ${message.timestamp} ${message.message}`
        );
      } else if (message.level === 'error') {
        console.error(
          `[WebView ${message.level.toUpperCase()}] ${message.timestamp} ${message.message}`
        );
      } else if (message.level === 'info') {
        console.info(
          `[WebView ${message.level.toUpperCase()}] ${message.timestamp} ${message.message}`
        );
      } else if (message.level === 'debug') {
        console.debug(
          `[WebView ${message.level.toUpperCase()}] ${message.timestamp} ${message.message}`
        );
      }
    } else if (message.type === 'init') {
      let count = 0;
      while (!appInitialized.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        count++;
        if (count > 100) {
          throw new Error('App initialization timed out');
        }
      }
      sendMessage({ type: 'init_result' });
    } else if (message.type === 'mutation') {
      if (!app.current) {
        return;
      }

      const result = await app.current.mediator.executeMutation(message.input);
      sendMessage({
        type: 'mutation_result',
        mutationId: message.mutationId,
        result,
      });
    } else if (message.type === 'query') {
      if (!app.current) {
        return;
      }

      const result = await app.current.mediator.executeQuery(message.input);
      sendMessage({ type: 'query_result', queryId: message.queryId, result });
    } else if (message.type === 'query_and_subscribe') {
      if (!app.current) {
        return;
      }

      const result = await app.current.mediator.executeQueryAndSubscribe(
        message.key,
        message.windowId,
        message.input
      );
      sendMessage({
        type: 'query_and_subscribe_result',
        queryId: message.queryId,
        key: message.key,
        windowId: message.windowId,
        result,
      });
    } else if (message.type === 'query_unsubscribe') {
      if (!app.current) {
        return;
      }

      app.current.mediator.unsubscribeQuery(message.key, message.windowId);
    } else if (message.type === 'event') {
      eventBus.publish(message.event);
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
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={styles.container}
    >
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
        setSupportMultipleWindows={false}
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
};
