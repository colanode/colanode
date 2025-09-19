import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

import { AccountLogoutScreen } from '@colanode/ui/components/accounts/account-logout-screen';
import { AccountSettingsScreen } from '@colanode/ui/components/accounts/account-settings-screen';
import { LoginScreen } from '@colanode/ui/components/accounts/login-screen';
import { AppAppearanceSettingsScreen } from '@colanode/ui/components/app/app-appearance-settings-screen';
import { AppHomeScreen } from '@colanode/ui/components/app/app-home-screen';
import { RootLayout } from '@colanode/ui/components/layouts/root-layout';
import { NodeScreen } from '@colanode/ui/components/nodes/node-screen';
import { WorkspaceDownloadsScreen } from '@colanode/ui/components/workspaces/downloads/workspace-downloads-screen';
import { WorkspaceStorageScreen } from '@colanode/ui/components/workspaces/storage/workspace-storage-screen';
import { WorkspaceUploadsScreen } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-screen';
import { WorkspaceCreateScreen } from '@colanode/ui/components/workspaces/workspace-create-screen';
import { WorkspaceHomeScreen } from '@colanode/ui/components/workspaces/workspace-home-screen';
import { WorkspaceScreen } from '@colanode/ui/components/workspaces/workspace-screen';
import { WorkspaceSettingsScreen } from '@colanode/ui/components/workspaces/workspace-settings-screen';
import { WorkspaceUsersScreen } from '@colanode/ui/components/workspaces/workspace-users-screen';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

export const appHomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppHomeScreen,
});

export const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
  component: WorkspaceScreen,
});

export const workspaceHomeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: WorkspaceHomeScreen,
});

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: WorkspaceCreateScreen,
});

export const nodeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/$nodeId',
  component: NodeScreen,
});

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettingsScreen,
});

export const workspaceUsersRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/users',
  component: WorkspaceUsersScreen,
});

export const workspaceStorageRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/storage',
  component: WorkspaceStorageScreen,
});

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploadsScreen,
});

export const workspaceDownloadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/downloads',
  component: WorkspaceDownloadsScreen,
});

export const accountSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/settings',
  component: AccountSettingsScreen,
});

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogoutScreen,
});

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsScreen,
});

export const routeTree = rootRoute.addChildren([
  appHomeRoute,
  loginRoute,
  workspaceCreateRoute,
  workspaceRoute.addChildren([
    workspaceHomeRoute,
    nodeRoute,
    workspaceDownloadsRoute,
    workspaceUploadsRoute,
    workspaceStorageRoute,
    workspaceUsersRoute,
    workspaceSettingsRoute,
    accountSettingsRoute,
    accountLogoutRoute,
    appAppearanceRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
