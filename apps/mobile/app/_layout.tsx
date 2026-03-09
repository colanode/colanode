import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { modelName } from 'expo-device';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';

import { AppMeta, AppService } from '@colanode/client/services';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import {
  AppServiceContext,
  useAppService,
} from '@colanode/mobile/contexts/app-service';
import { ThemeProvider, useTheme } from '@colanode/mobile/contexts/theme';
import { copyAssets } from '@colanode/mobile/lib/assets';
import { buildQueryClient } from '@colanode/mobile/lib/query-client';
import { MobileFileSystem } from '@colanode/mobile/services/file-system';
import { MobileKyselyService } from '@colanode/mobile/services/kysely-service';
import { MobilePathService } from '@colanode/mobile/services/path-service';

SplashScreen.preventAutoHideAsync();

function ThemeStatusBar() {
  const { scheme } = useTheme();
  return (
    <StatusBar
      barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

export default function RootLayout() {
  const [appService, setAppService] = useState<AppService | null>(null);
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const paths = new MobilePathService();
        await copyAssets(paths);

        const appMeta: AppMeta = {
          type: 'mobile',
          platform: modelName ?? 'unknown',
        };

        const service = new AppService(
          appMeta,
          new MobileFileSystem(),
          new MobileKyselyService(),
          paths
        );

        await service.migrate();
        await service.init();

        // Add default Colanode servers (idempotent — skips if already present)
        await service.createServer(new URL('https://eu.colanode.com/config'));
        await service.createServer(new URL('https://us.colanode.com/config'));

        const client = buildQueryClient(service.mediator);

        setAppService(service);
        setQueryClient(client);
        setReady(true);
      } catch (error) {
        console.error('Failed to initialize AppService:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (!ready || !appService || !queryClient) {
    return (
      <ThemeProvider>
        <ThemeStatusBar />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ThemeStatusBar />
      <AppServiceContext.Provider value={{ appService }}>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </AppServiceContext.Provider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { appService } = useAppService();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) {
      return;
    }

    const accounts = appService.getAccounts();
    const workspaces = appService.getWorkspaces();
    const inAuthGroup = segments[0] === '(auth)';

    if (accounts.length === 0) {
      // No accounts -> go to server selection
      if (!inAuthGroup) {
        router.replace('/(auth)/');
      }
    } else if (workspaces.length > 0) {
      // Has account + workspace -> go to app
      if (inAuthGroup || (segments as string[]).length === 0) {
        router.replace('/(app)/(home)');
      }
    } else {
      // Has account but no workspace -> create workspace
      const firstAccount = accounts[0]!;
      router.replace({
        pathname: '/(auth)/create-workspace',
        params: { accountId: firstAccount.account.id },
      });
    }

    hasNavigated.current = true;
  }, [appService, segments, router]);

  return <Slot />;
}
