import Feather from '@expo/vector-icons/Feather';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Workspace } from '@colanode/client/types/workspaces';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { NetworkBanner } from '@colanode/mobile/components/ui/network-banner';
import { WorkspaceSwitcherSheet } from '@colanode/mobile/components/workspaces/workspace-switcher-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { WorkspaceContext } from '@colanode/mobile/contexts/workspace';
import { WorkspaceSwitcherContext } from '@colanode/mobile/contexts/workspace-switcher';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { getChatUnreadCount } from '@colanode/mobile/lib/radar-utils';

export default function AppLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate } = useMutation();
  const { colors } = useTheme();
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const { data: workspaces, isLoading } = useLiveQuery({
    type: 'workspace.list',
  });

  const { data: metadata } = useLiveQuery({
    type: 'metadata.list',
  });

  const { data: radarData } = useLiveQuery({
    type: 'radar.data.get',
  });

  // Resolve selected workspace from metadata
  const resolveWorkspace = (): Workspace | undefined => {
    if (!workspaces || workspaces.length === 0) return undefined;

    const storedEntry = metadata?.find(
      (m) => m.namespace === 'app' && m.key === 'workspace'
    );

    if (storedEntry) {
      try {
        const storedUserId = JSON.parse(storedEntry.value) as string;
        const found = workspaces.find((w) => w.userId === storedUserId);
        if (found) return found;
      } catch {
        // ignore parse errors, fall through to default
      }
    }

    return workspaces[0];
  };

  const workspace = resolveWorkspace();
  const lastWorkspaceRef = useRef<Workspace | null>(null);

  if (workspace) {
    lastWorkspaceRef.current = workspace;
  } else if (!isLoading) {
    // Data loaded but no workspace found (logged out) — clear the ref
    // so children unmount and stop querying the destroyed DB
    lastWorkspaceRef.current = null;
  }

  const activeWorkspace = workspace ?? lastWorkspaceRef.current;

  const { data: accounts } = useLiveQuery({ type: 'account.list' });

  useEffect(() => {
    if (!isLoading && !workspace) {
      if (accounts && accounts.length > 0) {
        const firstAccount = accounts[0] as { id: string };
        router.replace({
          pathname: '/(auth)/create-workspace',
          params: { accountId: firstAccount.id },
        });
      } else {
        router.replace('/(auth)/');
      }
    }
  }, [isLoading, workspace, accounts, router]);

  const handleSelectWorkspace = useCallback(
    async (userId: string) => {
      mutate({
        input: {
          type: 'metadata.update',
          namespace: 'app',
          key: 'workspace',
          value: JSON.stringify(userId),
        },
      });
      await queryClient.cancelQueries();
      queryClient.clear();
    },
    [mutate, queryClient]
  );

  const handleCreateWorkspace = useCallback(() => {
    router.push('/(app)/(settings)/create-workspace');
  }, [router]);

  const openSwitcher = useCallback(() => {
    setSwitcherVisible(true);
  }, []);

  if (isLoading || !activeWorkspace) {
    return <LoadingScreen />;
  }

  const chatUnreadCount = getChatUnreadCount(radarData, activeWorkspace.userId);

  return (
    <WorkspaceSwitcherContext.Provider value={{ openSwitcher }}>
      <WorkspaceContext.Provider
        value={{
          userId: activeWorkspace.userId,
          accountId: activeWorkspace.accountId,
          workspaceId: activeWorkspace.workspaceId,
          role: activeWorkspace.role,
          workspace: activeWorkspace,
        }}
      >
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <NetworkBanner />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: colors.tabBarBackground,
                borderTopColor: colors.tabBarBorder,
              },
              tabBarActiveTintColor: colors.tabBarActive,
              tabBarInactiveTintColor: colors.tabBarInactive,
            }}
          >
            <Tabs.Screen
              name="(home)"
              options={{
                title: 'Home',
                tabBarLabel: 'Home',
                tabBarIcon: ({ color }: { color: string }) => (
                  <Feather name="home" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="(spaces)"
              options={{
                title: 'Spaces',
                tabBarLabel: 'Spaces',
                tabBarIcon: ({ color }: { color: string }) => (
                  <Feather name="layers" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="(chats)"
              options={{
                title: 'Chats',
                tabBarLabel: 'Chats',
                tabBarBadge: chatUnreadCount > 0 ? chatUnreadCount : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: colors.badgeBackground,
                  fontSize: 11,
                  minWidth: 18,
                  height: 18,
                  lineHeight: 18,
                },
                tabBarIcon: ({ color }: { color: string }) => (
                  <Feather name="message-circle" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="(settings)"
              options={{
                title: 'Settings',
                tabBarLabel: 'Settings',
                tabBarIcon: ({ color }: { color: string }) => (
                  <Feather name="settings" size={24} color={color} />
                ),
              }}
            />
          </Tabs>
          <WorkspaceSwitcherSheet
            visible={switcherVisible}
            currentUserId={activeWorkspace.userId}
            onSelectWorkspace={handleSelectWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            onClose={() => setSwitcherVisible(false)}
          />
        </View>
      </WorkspaceContext.Provider>
    </WorkspaceSwitcherContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
