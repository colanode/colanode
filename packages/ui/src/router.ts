import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

import { AccountLogout } from '@colanode/ui/components/accounts/account-logout';
import { AccountSettings } from '@colanode/ui/components/accounts/account-settings';
import { Login } from '@colanode/ui/components/accounts/login';
import { AppAppearanceSettings } from '@colanode/ui/components/app/app-appearance-settings';
import { AppHome } from '@colanode/ui/components/app-home';
import { NodeContainer } from '@colanode/ui/components/layouts/nodes/node-container';
import { RootLayout } from '@colanode/ui/components/layouts/root-layout';
import { WorkspaceDownloads } from '@colanode/ui/components/workspaces/downloads/workspace-downloads';
import { WorkspaceStorage } from '@colanode/ui/components/workspaces/storage/workspace-storage';
import { WorkspaceUploads } from '@colanode/ui/components/workspaces/uploads/workspace-uploads';
import { WorkspaceContainer } from '@colanode/ui/components/workspaces/workspace-container';
import { WorkspaceCreate } from '@colanode/ui/components/workspaces/workspace-create';
import { WorkspaceSettings } from '@colanode/ui/components/workspaces/workspace-settings';
import { WorkspaceUsers } from '@colanode/ui/components/workspaces/workspace-users';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

export const appHomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppHome,
});

export const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
  component: WorkspaceContainer,
});

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: WorkspaceCreate,
});

export const nodeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/$nodeId',
  component: NodeContainer,
});

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettings,
});

export const workspaceUsersRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/users',
  component: WorkspaceUsers,
});

export const workspaceStorageRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/storage',
  component: WorkspaceStorage,
});

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploads,
});

export const workspaceDownloadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/downloads',
  component: WorkspaceDownloads,
});

export const accountSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/settings',
  component: AccountSettings,
});

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogout,
});

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettings,
});

export const routeTree = rootRoute.addChildren([
  appHomeRoute,
  loginRoute,
  workspaceCreateRoute,
  workspaceRoute.addChildren([
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
